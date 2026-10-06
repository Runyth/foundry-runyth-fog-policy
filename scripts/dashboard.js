import { MODULE_ID } from "./constants.js";
import { filterSceneRecords, normalizeText } from "./core/filter-core.js";
import {
  buildFolderIndex,
  buildSceneRecords,
  expandSelectedFolders
} from "./core/scene-index-core.js";
import { FogPolicyError, reportError } from "./errors.js";
import {
  exportBackup,
  exportSelection,
  loadImportFile,
  restoreGlobalSettings,
  assertBackupImport,
  assertSelectionImport
} from "./services/backup-service.js";
import {
  getAudit,
  purgeStoredExploration,
  repairExistingScenes,
  restoreSceneStates,
  setScenesExempt
} from "./policy.js";
import {
  getSceneExemptFlag,
  isSceneManaged
} from "./policy-core.js";
import { readPolicySettings } from "./settings.js";
import { FixedRowVirtualList } from "./ui/virtual-list.js";

const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const SCENE_ROW_HEIGHT = 48;
const FOLDER_ROW_HEIGHT = 34;
const SEARCH_DEBOUNCE_MS = 120;

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text != null) element.textContent = String(text);
  return element;
}

function statusLabel(record) {
  return game.i18n.localize(`RUNYTH_FOG_POLICY.Dashboard.Status.${record.status}`);
}

function getCheckedValues(root, selector) {
  return new Set(
    [...root.querySelectorAll(selector)]
      .filter((input) => input.checked)
      .map((input) => input.value)
  );
}

export class FogPolicyDashboard extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-dashboard`,
    classes: [MODULE_ID, "standard-form"],
    position: {
      width: 1040,
      height: 820
    },
    window: {
      title: "RUNYTH_FOG_POLICY.Dashboard.Title",
      icon: "fa-solid fa-eye-slash",
      resizable: true
    },
    actions: {
      audit() {
        return this._refreshData({ resetScroll: false });
      },
      selectFiltered() {
        return this._selectFiltered();
      },
      clearSelection() {
        return this._clearSelection();
      },
      invertFiltered() {
        return this._invertFiltered();
      },
      repairSelected() {
        return this._repairSelected();
      },
      repairAll() {
        return this._repairAll();
      },
      exemptSelected() {
        return this._setSelectedExempt(true);
      },
      manageSelected() {
        return this._setSelectedExempt(false);
      },
      purgeSelected() {
        return this._purgeSelected();
      },
      exportBackup() {
        return this._exportBackup();
      },
      exportSelection() {
        return this._exportSelection();
      },
      importBackup() {
        this.element.querySelector('[data-file-input="backup"]')?.click();
      },
      importSelection() {
        this.element.querySelector('[data-file-input="selection"]')?.click();
      },
      resetFilters() {
        return this._resetFilters();
      }
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/dashboard.hbs`
    }
  };

  _selectedSceneIds = new Set();
  _records = [];
  _recordById = new Map();
  _filteredRecords = [];
  _folderIndex = null;
  _folderRows = [];
  _sceneVirtualList = null;
  _folderVirtualList = null;
  _searchTimer = null;
  _folderSearchTimer = null;
  _busy = false;
  _settings = null;
  _auditSummary = null;
  _filters = {
    query: "",
    folderQuery: "",
    statuses: new Set(),
    fogStates: new Set(),
    folderIds: new Set(),
    includeDescendants: true,
    selectedOnly: false
  };

  async _prepareContext(options) {
    const context = (await super._prepareContext(options)) ?? {};
    this._rebuildIndexes();
    const settings = readPolicySettings();
    return {
      ...context,
      settings,
      audit: this._auditSummary,
      policyStatusKey: settings.enabled
        ? "RUNYTH_FOG_POLICY.Dashboard.PolicyEnabled"
        : "RUNYTH_FOG_POLICY.Dashboard.PolicyDisabled"
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this._bindDashboardEvents();
    this._createVirtualLists();
    this._applyFilters({ resetScroll: false });
    this._updateSummary();
  }

  _onClose(options) {
    this._destroyVirtualLists();
    if (this._searchTimer !== null) clearTimeout(this._searchTimer);
    if (this._folderSearchTimer !== null) clearTimeout(this._folderSearchTimer);
    return super._onClose(options);
  }

  _rebuildIndexes() {
    const settings = readPolicySettings();
    this._settings = settings;
    this._folderIndex = buildFolderIndex(game.folders?.contents ?? []);
    this._records = buildSceneRecords(
      game.scenes?.contents ?? [],
      this._folderIndex,
      settings,
      isSceneManaged,
      getSceneExemptFlag
    );
    this._recordById = new Map(this._records.map((record) => [record.id, record]));
    const audit = { total: this._records.length, managed: 0, compliant: 0, nonCompliant: 0, exempt: 0 };
    for (const record of this._records) {
      if (record.managed) {
        audit.managed += 1;
        if (record.compliant) audit.compliant += 1;
        else audit.nonCompliant += 1;
      }
      if (record.exempt && settings.allowSceneExemptions) audit.exempt += 1;
    }
    this._auditSummary = audit;

    for (const id of [...this._selectedSceneIds]) {
      if (!this._recordById.has(id)) this._selectedSceneIds.delete(id);
    }

    this._folderRows = this._buildFolderRows();
  }

  _buildFolderRows() {
    const counts = new Map([["__root__", 0]]);
    for (const folder of this._folderIndex.flattened) counts.set(folder.id, 0);

    for (const record of this._records) {
      if (!record.folderId) {
        counts.set("__root__", (counts.get("__root__") ?? 0) + 1);
        continue;
      }
      let currentId = record.folderId;
      const visited = new Set();
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        counts.set(currentId, (counts.get(currentId) ?? 0) + 1);
        currentId = this._folderIndex.byId.get(currentId)?.parentId ?? null;
      }
    }

    return [
      Object.freeze({
        id: "__root__",
        name: game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.Unfoldered"),
        path: game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.Unfoldered"),
        depth: 0,
        count: counts.get("__root__") ?? 0,
        searchPath: normalizeText(game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.Unfoldered")),
        parentId: null,
        root: true
      }),
      ...this._folderIndex.flattened.map((folder) => Object.freeze({
        ...folder,
        count: counts.get(folder.id) ?? 0,
        searchPath: normalizeText(folder.path),
        root: false
      }))
    ];
  }

  _bindDashboardEvents() {
    const root = this.element;
    const sceneSearch = root.querySelector('[data-filter="scene-search"]');
    const folderSearch = root.querySelector('[data-filter="folder-search"]');

    sceneSearch?.addEventListener("input", (event) => {
      this._filters.query = event.currentTarget.value;
      this._scheduleFilter();
    });
    folderSearch?.addEventListener("input", (event) => {
      this._filters.folderQuery = event.currentTarget.value;
      this._scheduleFolderFilter();
    });

    root.querySelectorAll('[data-filter-group="status"], [data-filter-group="fog"]').forEach((input) => {
      input.addEventListener("change", () => {
        this._filters.statuses = getCheckedValues(root, '[data-filter-group="status"]');
        this._filters.fogStates = getCheckedValues(root, '[data-filter-group="fog"]');
        this._applyFilters();
      });
    });

    root.querySelector('[data-filter="include-descendants"]')?.addEventListener("change", (event) => {
      this._filters.includeDescendants = event.currentTarget.checked;
      this._applyFilters();
    });
    root.querySelector('[data-filter="selected-only"]')?.addEventListener("change", (event) => {
      this._filters.selectedOnly = event.currentTarget.checked;
      this._applyFilters();
    });

    root.querySelector('[data-file-input="backup"]')?.addEventListener("change", (event) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      if (file) void this._importBackupFile(file);
    });
    root.querySelector('[data-file-input="selection"]')?.addEventListener("change", (event) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      if (file) void this._importSelectionFile(file);
    });
  }

  _createVirtualLists() {
    this._destroyVirtualLists();
    const sceneContainer = this.element.querySelector('[data-virtual-list="scenes"]');
    const folderContainer = this.element.querySelector('[data-virtual-list="folders"]');
    if (!sceneContainer || !folderContainer) return;

    this._sceneVirtualList = new FixedRowVirtualList({
      container: sceneContainer,
      rowHeight: SCENE_ROW_HEIGHT,
      overscan: 10,
      renderRow: (record) => this._renderSceneRow(record)
    });
    this._folderVirtualList = new FixedRowVirtualList({
      container: folderContainer,
      rowHeight: FOLDER_ROW_HEIGHT,
      overscan: 8,
      renderRow: (folder) => this._renderFolderRow(folder)
    });

    sceneContainer.addEventListener("change", (event) => {
      const input = event.target.closest('[data-scene-select]');
      if (!input) return;
      const id = input.dataset.sceneId;
      if (!id) return;
      if (input.checked) this._selectedSceneIds.add(id);
      else this._selectedSceneIds.delete(id);
      this._updateSummary();
      this._updateActionAvailability();
    });

    sceneContainer.addEventListener("click", (event) => {
      const button = event.target.closest('[data-row-action="toggle-exempt"]');
      if (!button) return;
      const id = button.dataset.sceneId;
      const record = this._recordById.get(id);
      if (!record) return;
      void this._runOperation(
        game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.Exemption"),
        async () => setScenesExempt([id], !record.exempt)
      );
    });

    folderContainer.addEventListener("change", (event) => {
      const input = event.target.closest('[data-folder-select]');
      if (!input) return;
      const id = input.dataset.folderId;
      if (!id) return;
      if (input.checked) this._filters.folderIds.add(id);
      else this._filters.folderIds.delete(id);
      this._applyFilters();
    });
  }

  _destroyVirtualLists() {
    this._sceneVirtualList?.destroy();
    this._folderVirtualList?.destroy();
    this._sceneVirtualList = null;
    this._folderVirtualList = null;
  }

  _renderSceneRow(record) {
    const row = createElement("div", `scene-virtual-row status-${record.status}`);
    row.dataset.sceneId = record.id;
    row.setAttribute("role", "row");

    const selectionCell = createElement("div", "scene-cell scene-select-cell");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = this._selectedSceneIds.has(record.id);
    checkbox.dataset.sceneSelect = "true";
    checkbox.dataset.sceneId = record.id;
    checkbox.setAttribute("aria-label", game.i18n.format("RUNYTH_FOG_POLICY.Dashboard.SelectScene", { name: record.name }));
    selectionCell.append(checkbox);

    const nameCell = createElement("div", "scene-cell scene-name-cell");
    const name = createElement("strong", "scene-name", record.name);
    const folder = createElement(
      "span",
      "scene-folder-path",
      record.folderPath || game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.Unfoldered")
    );
    name.title = record.name;
    folder.title = record.folderPath || folder.textContent;
    nameCell.append(name, folder);

    const fogCell = createElement(
      "div",
      "scene-cell",
      game.i18n.localize(record.exploration ? "RUNYTH_FOG_POLICY.Common.Enabled" : "RUNYTH_FOG_POLICY.Common.Disabled")
    );
    const statusCell = createElement("div", "scene-cell", statusLabel(record));
    const actionCell = createElement("div", "scene-cell scene-action-cell");

    const button = createElement(
      "button",
      "inline-control",
      game.i18n.localize(
        record.exempt
          ? "RUNYTH_FOG_POLICY.Dashboard.RemoveExemption"
          : "RUNYTH_FOG_POLICY.Dashboard.AddExemption"
      )
    );
    button.type = "button";
    button.dataset.rowAction = "toggle-exempt";
    button.dataset.sceneId = record.id;
    button.dataset.requiresExemptions = "true";
    button.disabled = !this._settings?.allowSceneExemptions || this._busy;
    actionCell.append(button);

    row.append(selectionCell, nameCell, fogCell, statusCell, actionCell);
    return row;
  }

  _renderFolderRow(folder) {
    const row = createElement("label", "folder-virtual-row");
    row.style.setProperty("--folder-depth", String(folder.depth));
    row.title = folder.path;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = this._filters.folderIds.has(folder.id);
    checkbox.dataset.folderSelect = "true";
    checkbox.dataset.folderId = folder.id;

    const label = createElement("span", "folder-label", folder.name);
    const count = createElement("span", "folder-count", folder.count);
    row.append(checkbox, label, count);
    return row;
  }

  _scheduleFilter() {
    if (this._searchTimer !== null) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this._searchTimer = null;
      this._applyFilters();
    }, SEARCH_DEBOUNCE_MS);
  }

  _scheduleFolderFilter() {
    if (this._folderSearchTimer !== null) clearTimeout(this._folderSearchTimer);
    this._folderSearchTimer = setTimeout(() => {
      this._folderSearchTimer = null;
      this._renderFolderRows();
    }, SEARCH_DEBOUNCE_MS);
  }

  _applyFilters({ resetScroll = true } = {}) {
    const descendantFolderIds = this._filters.includeDescendants
      ? expandSelectedFolders(this._filters.folderIds, this._folderIndex)
      : new Set(this._filters.folderIds);

    this._filteredRecords = filterSceneRecords(this._records, {
      ...this._filters,
      selectedIds: this._selectedSceneIds,
      descendantFolderIds
    });
    this._sceneVirtualList?.setItems(this._filteredRecords, { preserveScroll: !resetScroll });
    this._renderFolderRows();
    this._updateSummary();
    this._updateActionAvailability();
  }

  _renderFolderRows() {
    const query = normalizeText(this._filters.folderQuery);
    let rows = this._folderRows;
    if (query) {
      const visibleIds = new Set();
      for (const folder of this._folderRows) {
        if (!folder.searchPath.includes(query)) continue;
        visibleIds.add(folder.id);
        let parentId = folder.parentId;
        const visited = new Set();
        while (parentId && !visited.has(parentId)) {
          visited.add(parentId);
          visibleIds.add(parentId);
          parentId = this._folderIndex.byId.get(parentId)?.parentId ?? null;
        }
      }
      rows = this._folderRows.filter((folder) => visibleIds.has(folder.id));
    }
    this._folderVirtualList?.setItems(rows, { preserveScroll: true });
    const count = this.element.querySelector('[data-folder-visible-count]');
    if (count) count.textContent = String(rows.length);
  }

  _updateSummary() {
    const audit = this._auditSummary ?? getAudit();
    const values = {
      total: audit.total,
      managed: audit.managed,
      compliant: audit.compliant,
      nonCompliant: audit.nonCompliant,
      exempt: audit.exempt,
      visible: this._filteredRecords.length,
      selected: this._selectedSceneIds.size
    };
    for (const [key, value] of Object.entries(values)) {
      const target = this.element.querySelector(`[data-summary="${key}"]`);
      if (target) target.textContent = String(value);
    }
  }

  _updateActionAvailability() {
    const hasSelection = this._selectedSceneIds.size > 0;
    const settings = this._settings ?? readPolicySettings();
    for (const button of this.element.querySelectorAll("button")) {
      const requiresSelection = button.hasAttribute("data-requires-selection");
      const requiresPolicy = button.hasAttribute("data-requires-policy");
      const requiresExemptions = button.hasAttribute("data-requires-exemptions");
      button.disabled = this._busy ||
        (requiresSelection && !hasSelection) ||
        (requiresPolicy && !settings.enabled) ||
        (requiresExemptions && !settings.allowSceneExemptions);
    }
  }

  _setBusy(value, message = "") {
    this._busy = value === true;
    this.element.classList.toggle("is-busy", this._busy);
    this.element.setAttribute("aria-busy", String(this._busy));
    const status = this.element.querySelector('[data-operation-status]');
    if (status) status.textContent = message;
    this._updateActionAvailability();
  }

  async _runOperation(label, operation, { refresh = true } = {}) {
    if (this._busy) return null;
    this._setBusy(true, game.i18n.format("RUNYTH_FOG_POLICY.Dashboard.Working", { operation: label }));
    try {
      const result = await operation();
      if (result?.cancelled === true) {
        const status = this.element.querySelector('[data-operation-status]');
        if (status) status.textContent = game.i18n.format("RUNYTH_FOG_POLICY.Dashboard.Cancelled", { operation: label });
        return result;
      }
      if (refresh) await this._refreshData({ resetScroll: false, preserveStatus: true });
      const status = this.element.querySelector('[data-operation-status]');
      if (status) status.textContent = game.i18n.format("RUNYTH_FOG_POLICY.Dashboard.Completed", { operation: label });
      return result;
    } catch (error) {
      reportError(error, { context: label });
      const status = this.element.querySelector('[data-operation-status]');
      if (status) status.textContent = game.i18n.format("RUNYTH_FOG_POLICY.Dashboard.Failed", { operation: label });
      return null;
    } finally {
      this._busy = false;
      this.element.classList.remove("is-busy");
      this.element.setAttribute("aria-busy", "false");
      this._updateActionAvailability();
    }
  }

  async _refreshData({ resetScroll = false, preserveStatus = false } = {}) {
    this._rebuildIndexes();
    this._applyFilters({ resetScroll });
    if (!preserveStatus) {
      const status = this.element.querySelector('[data-operation-status]');
      if (status) status.textContent = game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.Ready");
    }
  }

  _selectFiltered() {
    for (const record of this._filteredRecords) this._selectedSceneIds.add(record.id);
    this._sceneVirtualList?.render();
    this._updateSummary();
    this._updateActionAvailability();
  }

  _clearSelection() {
    this._selectedSceneIds.clear();
    this._sceneVirtualList?.render();
    this._updateSummary();
    this._updateActionAvailability();
    if (this._filters.selectedOnly) this._applyFilters();
  }

  _invertFiltered() {
    for (const record of this._filteredRecords) {
      if (this._selectedSceneIds.has(record.id)) this._selectedSceneIds.delete(record.id);
      else this._selectedSceneIds.add(record.id);
    }
    this._sceneVirtualList?.render();
    this._updateSummary();
    this._updateActionAvailability();
    if (this._filters.selectedOnly) this._applyFilters();
  }

  _selectedIds() {
    return [...this._selectedSceneIds];
  }

  _selectedRecords() {
    return this._selectedIds().map((id) => this._recordById.get(id)).filter(Boolean);
  }

  _exportTargetRecords() {
    const target = this.element.querySelector('input[name="backup-target"]:checked')?.value ?? "selected";
    const records = target === "filtered" ? this._filteredRecords : this._selectedRecords();
    if (records.length === 0) {
      throw new FogPolicyError(
        "RFP-EXPORT-EMPTY",
        target === "filtered"
          ? "No Scenes match the current filters."
          : "No Scenes are selected."
      );
    }
    return records;
  }

  _repairSelected() {
    return this._runOperation(
      game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.RepairSelected"),
      () => repairExistingScenes({ notify: true, sceneIds: this._selectedIds() })
    );
  }

  _repairAll() {
    return this._runOperation(
      game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.RepairAll"),
      () => repairExistingScenes({ notify: true })
    );
  }

  _setSelectedExempt(exempt) {
    return this._runOperation(
      game.i18n.localize(exempt
        ? "RUNYTH_FOG_POLICY.Dashboard.ExemptSelected"
        : "RUNYTH_FOG_POLICY.Dashboard.ManageSelected"),
      () => setScenesExempt(this._selectedIds(), exempt)
    );
  }

  async _purgeSelected() {
    const ids = this._selectedIds();
    if (ids.length === 0) return;
    const confirmed = await DialogV2.confirm({
      window: { title: game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.PurgeConfirmTitle") },
      content: `<p>${game.i18n.format("RUNYTH_FOG_POLICY.Dashboard.PurgeSelectedConfirmBody", { count: ids.length })}</p>`,
      modal: true,
      rejectClose: false
    });
    if (!confirmed) return;

    return this._runOperation(
      game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.PurgeSelected"),
      async () => {
        const result = await purgeStoredExploration({ sceneIds: ids, includeExempt: true });
        const partial = result.failedDeletes + result.discoveryFailures + result.resetFailures;
        if (partial > 0) {
          ui.notifications.warn(
            game.i18n.format("RUNYTH_FOG_POLICY.Notifications.PurgePartial", {
              deleted: result.deleted,
              failures: partial
            }),
            { permanent: true }
          );
        } else {
          ui.notifications.info(
            game.i18n.format("RUNYTH_FOG_POLICY.Notifications.Purged", {
              count: result.deleted,
              scenes: result.scenes
            })
          );
        }
        return result;
      }
    );
  }

  _exportBackup() {
    return this._runOperation(
      game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.ExportBackup"),
      async () => {
        const includeSettings = this.element.querySelector('[data-backup-option="settings"]')?.checked !== false;
        return exportBackup(this._exportTargetRecords(), { includeSettings });
      },
      { refresh: false }
    );
  }

  _exportSelection() {
    return this._runOperation(
      game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.ExportSelection"),
      async () => exportSelection(this._exportTargetRecords()),
      { refresh: false }
    );
  }

  async _importBackupFile(file) {
    return this._runOperation(
      game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.ImportBackup"),
      async () => {
        const imported = await loadImportFile(file, this._records);
        assertBackupImport(imported.data);
        const { matched, unmatched, ambiguous } = imported.matches;
        if (matched.length === 0) {
          throw new FogPolicyError(
            "RFP-IMPORT-NOMATCH",
            "The backup did not match any Scene in this world."
          );
        }

        const confirmed = await DialogV2.confirm({
          window: { title: game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.ImportBackupConfirmTitle") },
          content: `<p>${game.i18n.format("RUNYTH_FOG_POLICY.Dashboard.ImportBackupConfirmBody", {
            matched: matched.length,
            unmatched: unmatched.length,
            ambiguous: ambiguous.length
          })}</p>`,
          modal: true,
          rejectClose: false
        });
        if (!confirmed) return { cancelled: true };

        const restoreExemptions = this.element.querySelector('[data-import-option="exemptions"]')?.checked !== false;
        const restoreFog = this.element.querySelector('[data-import-option="fog"]')?.checked !== false;
        const restoreSettings = this.element.querySelector('[data-import-option="settings"]')?.checked === true;
        const safetyBackup = this.element.querySelector('[data-import-option="safety-backup"]')?.checked !== false;
        const selectMatches = this.element.querySelector('[data-import-option="select"]')?.checked !== false;

        if (safetyBackup) {
          exportBackup(matched.map((entry) => entry.record), {
            includeSettings: true,
            prefix: "pre-import-safety-backup"
          });
        }
        if (restoreSettings) await restoreGlobalSettings(imported.data.settings);
        const restoreResult = await restoreSceneStates(matched, { restoreExemptions, restoreFog });

        if (selectMatches) {
          this._selectedSceneIds = new Set(matched.map((entry) => entry.record.id));
        }

        if (restoreResult.conflicts.length > 0) {
          ui.notifications.warn(
            game.i18n.format("RUNYTH_FOG_POLICY.Notifications.RestoreConflicts", {
              count: restoreResult.conflicts.length
            }),
            { permanent: true }
          );
        }
        if (restoreResult.failed > 0) {
          ui.notifications.error(
            game.i18n.format("RUNYTH_FOG_POLICY.Notifications.RestoreFailed", {
              count: restoreResult.failed
            }),
            { permanent: true }
          );
        }
        return restoreResult;
      }
    );
  }

  async _importSelectionFile(file) {
    return this._runOperation(
      game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.ImportSelection"),
      async () => {
        const imported = await loadImportFile(file, this._records);
        assertSelectionImport(imported.data);
        const replace = this.element.querySelector('[data-selection-import-option="replace"]')?.checked !== false;
        if (replace) this._selectedSceneIds.clear();
        for (const match of imported.matches.matched) this._selectedSceneIds.add(match.record.id);

        ui.notifications.info(
          game.i18n.format("RUNYTH_FOG_POLICY.Notifications.SelectionImported", {
            matched: imported.matches.matched.length,
            unmatched: imported.matches.unmatched.length,
            ambiguous: imported.matches.ambiguous.length
          })
        );
        return imported.matches;
      }
    );
  }

  _resetFilters() {
    this._filters.query = "";
    this._filters.folderQuery = "";
    this._filters.statuses.clear();
    this._filters.fogStates.clear();
    this._filters.folderIds.clear();
    this._filters.includeDescendants = true;
    this._filters.selectedOnly = false;

    const root = this.element;
    const sceneSearch = root.querySelector('[data-filter="scene-search"]');
    const folderSearch = root.querySelector('[data-filter="folder-search"]');
    if (sceneSearch) sceneSearch.value = "";
    if (folderSearch) folderSearch.value = "";
    root.querySelectorAll('[data-filter-group="status"], [data-filter-group="fog"]').forEach((input) => {
      input.checked = false;
    });
    const descendants = root.querySelector('[data-filter="include-descendants"]');
    if (descendants) descendants.checked = true;
    const selectedOnly = root.querySelector('[data-filter="selected-only"]');
    if (selectedOnly) selectedOnly.checked = false;
    this._applyFilters({ resetScroll: true });
  }
}

export function registerDashboardMenu() {
  game.settings.registerMenu(MODULE_ID, "dashboard", {
    name: "RUNYTH_FOG_POLICY.Settings.Dashboard.Name",
    label: "RUNYTH_FOG_POLICY.Settings.Dashboard.Label",
    hint: "RUNYTH_FOG_POLICY.Settings.Dashboard.Hint",
    icon: "fa-solid fa-eye-slash",
    type: FogPolicyDashboard,
    restricted: true
  });
}
