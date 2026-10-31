// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
export const MODULE_ID = "runyth-fog-policy";
export const MODULE_TITLE = "Runyth Fog Policy";
export const MODULE_VERSION = "1.0.4";

export const SETTINGS = Object.freeze({
  ENABLED: "enabled",
  REPAIR_ON_READY: "repairOnReady",
  ENFORCE_CREATES: "enforceCreates",
  ENFORCE_UPDATES: "enforceUpdates",
  ALLOW_EXEMPTIONS: "allowSceneExemptions",
  NOTIFY_AUTOMATIC_REPAIR: "notifyAutomaticRepair",
  DASHBOARD_WINDOW_STATE: "dashboardWindowState"
});

export const FLAGS = Object.freeze({
  EXEMPT: "exempt"
});
