import test from "node:test";
import assert from "node:assert/strict";

import {
  auditScenes,
  buildRepairUpdates,
  chunk,
  forceFogExplorationDisabled,
  getPendingExemption,
  isSceneManaged,
  sceneNeedsRepair
} from "../scripts/policy-core.js";

function scene({ id, name, exploration = true, exempt = false, inCompendium = false }) {
  return {
    id,
    name,
    inCompendium,
    fog: { exploration },
    getFlag() {
      return exempt;
    }
  };
}

const settings = Object.freeze({
  enabled: true,
  allowSceneExemptions: true
});

const getProperty = (object, path) =>
  path.split(".").reduce((value, key) => value?.[key], object);

const setProperty = (object, path, value) => {
  const parts = path.split(".");
  let cursor = object;
  for (const key of parts.slice(0, -1)) {
    cursor[key] ??= {};
    cursor = cursor[key];
  }
  cursor[parts.at(-1)] = value;
  return true;
};

test("managed world Scenes are identified correctly", () => {
  assert.equal(isSceneManaged(scene({ id: "a", name: "A" }), settings), true);
  assert.equal(isSceneManaged(scene({ id: "b", name: "B", exempt: true }), settings), false);
  assert.equal(
    isSceneManaged(scene({ id: "c", name: "C", inCompendium: true }), settings),
    false
  );
  assert.equal(isSceneManaged(scene({ id: "d", name: "D" }), { ...settings, enabled: false }), false);
});

test("repair detection is idempotent", () => {
  const broken = scene({ id: "a", name: "A", exploration: true });
  const fixed = scene({ id: "b", name: "B", exploration: false });

  assert.equal(sceneNeedsRepair(broken, settings), true);
  assert.equal(sceneNeedsRepair(fixed, settings), false);
  assert.deepEqual(buildRepairUpdates([broken, fixed], settings), [
    { _id: "a", "fog.exploration": false }
  ]);
});

test("audit separates compliant, non-compliant, and exempt Scenes", () => {
  const result = auditScenes(
    [
      scene({ id: "a", name: "A", exploration: true }),
      scene({ id: "b", name: "B", exploration: false }),
      scene({ id: "c", name: "C", exploration: true, exempt: true })
    ],
    settings
  );

  assert.equal(result.total, 3);
  assert.equal(result.managed, 2);
  assert.equal(result.compliant, 1);
  assert.equal(result.nonCompliant, 1);
  assert.equal(result.exempt, 1);
  assert.deepEqual(
    result.rows.map((row) => row.status),
    ["nonCompliant", "compliant", "exempt"]
  );
});

test("flat fog.exploration updates are forced off", () => {
  const changes = { "fog.exploration": true };
  assert.equal(forceFogExplorationDisabled(changes, setProperty, getProperty), true);
  assert.equal(changes["fog.exploration"], false);
});

test("nested fog.exploration updates are forced off", () => {
  const changes = { fog: { exploration: true } };
  assert.equal(forceFogExplorationDisabled(changes, setProperty, getProperty), true);
  assert.equal(changes.fog.exploration, false);
});

test("unrelated updates are not modified", () => {
  const changes = { name: "Renamed" };
  assert.equal(forceFogExplorationDisabled(changes, setProperty, getProperty), false);
  assert.deepEqual(changes, { name: "Renamed" });
});

test("pending exemption changes are respected", () => {
  const managed = scene({ id: "a", name: "A", exempt: false });
  const exempt = scene({ id: "b", name: "B", exempt: true });

  assert.equal(
    getPendingExemption(
      managed,
      { flags: { "runyth-fog-policy": { exempt: true } } },
      settings,
      getProperty
    ),
    true
  );
  assert.equal(
    getPendingExemption(
      exempt,
      { flags: { "runyth-fog-policy": { exempt: false } } },
      settings,
      getProperty
    ),
    false
  );
});

test("flat pending exemption changes are respected", () => {
  const managed = scene({ id: "a", name: "A", exempt: false });
  assert.equal(
    getPendingExemption(
      managed,
      { "flags.runyth-fog-policy.exempt": true },
      settings,
      getProperty
    ),
    true
  );
});

test("global exemption disable ignores stored and pending exemptions", () => {
  const exempt = scene({ id: "a", name: "A", exempt: true });
  assert.equal(
    getPendingExemption(
      exempt,
      { "flags.runyth-fog-policy.exempt": true },
      { ...settings, allowSceneExemptions: false },
      getProperty
    ),
    false
  );
});

test("chunk splits arrays deterministically", () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 2), []);
  assert.throws(() => chunk([1], 0), RangeError);
});
