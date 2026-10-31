// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import { MODULE_ID, SETTINGS } from "./constants.js";

function registerBooleanSetting(key, name, hint, defaultValue, scope = "world") {
  game.settings.register(MODULE_ID, key, {
    name,
    hint,
    scope,
    config: true,
    type: Boolean,
    default: defaultValue
  });
}

export function registerSettings() {
  registerBooleanSetting(
    SETTINGS.ENABLED,
    "RUNYTH_FOG_POLICY.Settings.Enabled.Name",
    "RUNYTH_FOG_POLICY.Settings.Enabled.Hint",
    true
  );

  registerBooleanSetting(
    SETTINGS.REPAIR_ON_READY,
    "RUNYTH_FOG_POLICY.Settings.RepairOnReady.Name",
    "RUNYTH_FOG_POLICY.Settings.RepairOnReady.Hint",
    true
  );

  registerBooleanSetting(
    SETTINGS.ENFORCE_CREATES,
    "RUNYTH_FOG_POLICY.Settings.EnforceCreates.Name",
    "RUNYTH_FOG_POLICY.Settings.EnforceCreates.Hint",
    true
  );

  registerBooleanSetting(
    SETTINGS.ENFORCE_UPDATES,
    "RUNYTH_FOG_POLICY.Settings.EnforceUpdates.Name",
    "RUNYTH_FOG_POLICY.Settings.EnforceUpdates.Hint",
    true
  );

  registerBooleanSetting(
    SETTINGS.ALLOW_EXEMPTIONS,
    "RUNYTH_FOG_POLICY.Settings.AllowExemptions.Name",
    "RUNYTH_FOG_POLICY.Settings.AllowExemptions.Hint",
    true
  );

  registerBooleanSetting(
    SETTINGS.NOTIFY_AUTOMATIC_REPAIR,
    "RUNYTH_FOG_POLICY.Settings.NotifyAutomaticRepair.Name",
    "RUNYTH_FOG_POLICY.Settings.NotifyAutomaticRepair.Hint",
    true,
    "client"
  );

  // Hidden client-only UI state. Keeping this device-local avoids moving a
  // dashboard on one monitor/browser because another client uses a different
  // resolution or desktop layout.
  game.settings.register(MODULE_ID, SETTINGS.DASHBOARD_WINDOW_STATE, {
    scope: "client",
    config: false,
    type: String,
    default: ""
  });
}

export function readPolicySettings() {
  return Object.freeze({
    enabled: game.settings.get(MODULE_ID, SETTINGS.ENABLED),
    repairOnReady: game.settings.get(MODULE_ID, SETTINGS.REPAIR_ON_READY),
    enforceCreates: game.settings.get(MODULE_ID, SETTINGS.ENFORCE_CREATES),
    enforceUpdates: game.settings.get(MODULE_ID, SETTINGS.ENFORCE_UPDATES),
    allowSceneExemptions: game.settings.get(MODULE_ID, SETTINGS.ALLOW_EXEMPTIONS),
    notifyAutomaticRepair: game.settings.get(MODULE_ID, SETTINGS.NOTIFY_AUTOMATIC_REPAIR)
  });
}

export function readDashboardWindowState() {
  const value = game.settings.get(MODULE_ID, SETTINGS.DASHBOARD_WINDOW_STATE);
  if (typeof value !== "string" || value.length === 0) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDashboardWindowState(state) {
  const value = state && typeof state === "object" ? JSON.stringify(state) : "";
  return game.settings.set(MODULE_ID, SETTINGS.DASHBOARD_WINDOW_STATE, value);
}
