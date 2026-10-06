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
