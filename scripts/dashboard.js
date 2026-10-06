import { MODULE_ID } from "./constants.js";
import {
  getAudit,
  purgeStoredExploration,
  repairExistingScenes,
  setSceneExempt
} from "./policy.js";
import { readPolicySettings } from "./settings.js";

const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FogPolicyDashboard extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-dashboard`,
    classes: [MODULE_ID, "standard-form"],
    position: {
      width: 820,
      height: 720
    },
    window: {
      title: "RUNYTH_FOG_POLICY.Dashboard.Title",
      icon: "fa-solid fa-eye-slash",
      resizable: true
    },
    actions: {
      audit(event, target) {
        return this._onAudit(event, target);
      },
      repair(event, target) {
        return this._onRepair(event, target);
      },
      purge(event, target) {
        return this._onPurge(event, target);
      },
      toggleExempt(event, target) {
        return this._onToggleExempt(event, target);
      }
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/dashboard.hbs`
    }
  };

  async _prepareContext(options) {
    const context = (await super._prepareContext(options)) ?? {};
    const settings = readPolicySettings();
    const audit = getAudit();

    return {
      ...context,
      settings,
      audit,
      policyStatusKey: settings.enabled
        ? "RUNYTH_FOG_POLICY.Dashboard.PolicyEnabled"
        : "RUNYTH_FOG_POLICY.Dashboard.PolicyDisabled",
      rows: audit.rows.map((row) => ({
        ...row,
        statusKey: `RUNYTH_FOG_POLICY.Dashboard.Status.${row.status}`,
        explorationKey: row.exploration
          ? "RUNYTH_FOG_POLICY.Common.Enabled"
          : "RUNYTH_FOG_POLICY.Common.Disabled",
        exemptionActionKey: row.exempt
          ? "RUNYTH_FOG_POLICY.Dashboard.RemoveExemption"
          : "RUNYTH_FOG_POLICY.Dashboard.AddExemption"
      }))
    };
  }

  async _rerender() {
    await this.render({ force: true });
  }

  async _onAudit() {
    await this._rerender();
  }

  async _onRepair() {
    await repairExistingScenes();
    await this._rerender();
  }

  async _onPurge() {
    const confirmed = await DialogV2.confirm({
      window: {
        title: game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.PurgeConfirmTitle")
      },
      content: `<p>${game.i18n.localize("RUNYTH_FOG_POLICY.Dashboard.PurgeConfirmBody")}</p>`,
      modal: true,
      rejectClose: false
    });

    if (!confirmed) return;

    const result = await purgeStoredExploration();
    ui.notifications.info(
      game.i18n.format("RUNYTH_FOG_POLICY.Notifications.Purged", {
        count: result.deleted,
        scenes: result.scenes
      })
    );
    await this._rerender();
  }

  async _onToggleExempt(_event, target) {
    const sceneId = target.dataset.sceneId;
    if (!sceneId) return;

    const scene = game.scenes.get(sceneId);
    if (!scene) return;

    await setSceneExempt(sceneId, scene.getFlag(MODULE_ID, "exempt") !== true);
    await this._rerender();
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
