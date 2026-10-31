// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const cssUrl = new URL("../styles/runyth-fog-policy.css", import.meta.url);
const dashboardUrl = new URL("../scripts/dashboard.js", import.meta.url);
const templateUrl = new URL("../templates/dashboard.hbs", import.meta.url);

test("dashboard explicitly disables costly control animations and transitions", async () => {
  const css = await readFile(cssUrl, "utf8");
  assert.match(css, /transition:\s*none\s*!important/i);
  assert.match(css, /animation:\s*none\s*!important/i);
  assert.match(css, /contain:\s*strict/i);
});

test("large Scene and folder collections use virtual lists rather than native selects", async () => {
  const [dashboard, template] = await Promise.all([
    readFile(dashboardUrl, "utf8"),
    readFile(templateUrl, "utf8")
  ]);

  assert.match(dashboard, /VirtualList/);
  assert.match(template, /folder-virtual-list/);
  assert.match(template, /scene-virtual-list/);
  assert.doesNotMatch(template, /<select\b/i);
});

test("exemption actions declare the shared exemption-setting requirement", async () => {
  const [dashboard, template] = await Promise.all([
    readFile(dashboardUrl, "utf8"),
    readFile(templateUrl, "utf8")
  ]);

  assert.match(dashboard, /dataset\.requiresExemptions/);
  assert.match(dashboard, /requiresExemptions\s*&&\s*!settings\.allowSceneExemptions/);
  assert.match(template, /data-action="exemptSelected"[^>]*data-requires-exemptions/);
  assert.match(template, /data-action="manageSelected"[^>]*data-requires-exemptions/);
});


test("dashboard uses a native ApplicationV2 header help control and dedicated help window", async () => {
  const [dashboard, help] = await Promise.all([
    readFile(dashboardUrl, "utf8"),
    readFile(new URL("../scripts/help.js", import.meta.url), "utf8")
  ]);

  assert.match(dashboard, /window:\s*\{[\s\S]*controls:\s*\[/);
  assert.match(dashboard, /action:\s*"help"/);
  assert.match(dashboard, /openDashboardHelp/);
  assert.match(help, /FogPolicyDashboardHelp/);
});

test("dashboard layout is flat, responsive, and keeps the hierarchical folder list virtualized", async () => {
  const [template, css] = await Promise.all([
    readFile(templateUrl, "utf8"),
    readFile(cssUrl, "utf8")
  ]);

  assert.match(template, /class="search-toolbar"/);
  assert.match(template, /class="quick-filter-bar"/);
  assert.match(template, /data-folder-panel/);
  assert.match(template, /folder-virtual-list/);
  assert.doesNotMatch(template, /class="filter-panel"/);
  assert.doesNotMatch(template, /<details\s+open/i);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /scene-compact-meta/);
});

test("dashboard persists geometry through a hidden client setting and debounced ApplicationV2 position lifecycle", async () => {
  const [dashboard, settings] = await Promise.all([
    readFile(dashboardUrl, "utf8"),
    readFile(new URL("../scripts/settings.js", import.meta.url), "utf8")
  ]);

  assert.match(settings, /DASHBOARD_WINDOW_STATE/);
  assert.match(settings, /scope:\s*"client"/);
  assert.match(settings, /config:\s*false/);
  assert.match(dashboard, /_onPosition\(position\)/);
  assert.match(dashboard, /WINDOW_STATE_SAVE_DEBOUNCE_MS/);
  assert.match(dashboard, /_preClose\(options\)/);
});
