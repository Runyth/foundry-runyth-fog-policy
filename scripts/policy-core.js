// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { MODULE_ID, FLAGS } from "./constants.js";

export function getSceneExemptFlag(scene) {
  return scene?.getFlag?.(MODULE_ID, FLAGS.EXEMPT) === true;
}

export function isSceneManaged(scene, settings) {
  if (!settings?.enabled) return false;
  if (scene?.inCompendium) return false;
  if (settings.allowSceneExemptions && getSceneExemptFlag(scene)) return false;
  return true;
}

export function getPendingExemption(scene, changes, settings, getProperty) {
  if (!settings?.allowSceneExemptions) return false;

  const path = `flags.${MODULE_ID}.${FLAGS.EXEMPT}`;
  let requested;

  if (Object.hasOwn(changes ?? {}, path)) {
    requested = changes[path];
  } else {
    requested = getProperty(changes ?? {}, path);
  }

  if (requested === true) return true;
  if (requested === false || requested === null) return false;
  return getSceneExemptFlag(scene);
}

export function forceFogExplorationDisabled(changes, setProperty, getProperty) {
  if (!changes || typeof changes !== "object") return false;

  const flatKey = "fog.exploration";
  const hasFlatKey = Object.hasOwn(changes, flatKey);
  const requested = hasFlatKey ? changes[flatKey] : getProperty(changes, flatKey);

  if (requested !== true) return false;

  if (hasFlatKey) {
    changes[flatKey] = false;
  } else {
    setProperty(changes, flatKey, false);
  }

  return true;
}

export function sceneNeedsRepair(scene, settings) {
  return isSceneManaged(scene, settings) && scene?.fog?.exploration !== false;
}

export function buildRepairUpdates(scenes, settings) {
  return scenes
    .filter((scene) => sceneNeedsRepair(scene, settings))
    .map((scene) => ({
      _id: scene.id,
      "fog.exploration": false
    }));
}

export function auditScenes(scenes, settings) {
  const rows = scenes.map((scene) => {
    const exempt = getSceneExemptFlag(scene);
    const managed = isSceneManaged(scene, settings);
    const exploration = scene?.fog?.exploration === true;
    const compliant = !managed || !exploration;

    return {
      id: scene.id,
      name: scene.name,
      exempt,
      managed,
      exploration,
      compliant,
      status: exempt && settings.allowSceneExemptions
        ? "exempt"
        : compliant
          ? "compliant"
          : "nonCompliant"
    };
  });

  return {
    total: rows.length,
    managed: rows.filter((row) => row.managed).length,
    exempt: rows.filter((row) => row.exempt && settings.allowSceneExemptions).length,
    compliant: rows.filter((row) => row.managed && row.compliant).length,
    nonCompliant: rows.filter((row) => row.managed && !row.compliant).length,
    rows
  };
}

export function chunk(array, size) {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("Chunk size must be a positive integer.");
  }

  const chunks = [];
  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }
  return chunks;
}
