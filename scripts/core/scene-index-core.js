// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { normalizeText } from "./filter-core.js";

function safeId(value) {
  return typeof value === "string" && value ? value : null;
}

export function buildFolderIndex(folders) {
  const sceneFolders = (folders ?? [])
    .filter((folder) => folder?.type === "Scene")
    .map((folder) => ({
      id: safeId(folder.id),
      name: String(folder.name ?? "Unnamed Folder"),
      parentId: safeId(folder.folder),
      sort: Number.isFinite(folder.sort) ? folder.sort : 0
    }))
    .filter((folder) => folder.id);

  const byId = new Map(sceneFolders.map((folder) => [folder.id, folder]));
  const children = new Map();
  for (const folder of sceneFolders) {
    const parentId = byId.has(folder.parentId) ? folder.parentId : null;
    if (!children.has(parentId)) children.set(parentId, []);
    children.get(parentId).push(folder);
  }

  const compare = (a, b) => a.sort - b.sort || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  for (const values of children.values()) values.sort(compare);

  const pathCache = new Map();
  const resolving = new Set();
  function getPath(folderId) {
    if (!folderId || !byId.has(folderId)) return "";
    if (pathCache.has(folderId)) return pathCache.get(folderId);
    if (resolving.has(folderId)) return byId.get(folderId).name;
    resolving.add(folderId);
    const folder = byId.get(folderId);
    const parentPath = getPath(folder.parentId);
    const path = parentPath ? `${parentPath} / ${folder.name}` : folder.name;
    resolving.delete(folderId);
    pathCache.set(folderId, path);
    return path;
  }

  const flattened = [];
  const visitedFolders = new Set();
  function visitFolder(folder, depth) {
    if (visitedFolders.has(folder.id)) return;
    visitedFolders.add(folder.id);
    flattened.push(Object.freeze({
      ...folder,
      depth,
      path: getPath(folder.id)
    }));
    for (const child of children.get(folder.id) ?? []) visitFolder(child, depth + 1);
  }
  for (const folder of children.get(null) ?? []) visitFolder(folder, 0);
  // Corrupt/cyclic folder data should not make folders disappear from the picker.
  for (const folder of [...sceneFolders].sort(compare)) visitFolder(folder, 0);

  const descendants = new Map();
  function collectDescendants(folderId, stack = new Set()) {
    if (descendants.has(folderId)) return descendants.get(folderId);
    if (stack.has(folderId)) return new Set([folderId]);
    const nextStack = new Set(stack);
    nextStack.add(folderId);
    const result = new Set([folderId]);
    for (const child of children.get(folderId) ?? []) {
      for (const id of collectDescendants(child.id, nextStack)) result.add(id);
    }
    descendants.set(folderId, result);
    return result;
  }
  for (const folder of sceneFolders) collectDescendants(folder.id);

  return Object.freeze({
    byId,
    flattened: Object.freeze(flattened),
    getPath,
    descendants
  });
}

export function buildSceneRecords(scenes, folderIndex, settings, isSceneManaged, getSceneExemptFlag) {
  return Object.freeze((scenes ?? []).map((scene) => {
    const id = String(scene?.id ?? "");
    const name = String(scene?.name ?? "Unnamed Scene");
    const folderId = safeId(scene?.folder);
    const folderPath = folderIndex?.getPath?.(folderId) ?? "";
    const exempt = getSceneExemptFlag(scene);
    const managed = isSceneManaged(scene, settings);
    const exploration = scene?.fog?.exploration === true;
    const compliant = !managed || !exploration;
    const status = exempt && settings.allowSceneExemptions
      ? "exempt"
      : compliant
        ? "compliant"
        : "nonCompliant";

    const searchName = normalizeText(name);
    const searchFolder = normalizeText(folderPath);
    const searchId = normalizeText(id);

    return Object.freeze({
      id,
      name,
      folderId,
      folderPath,
      exempt,
      managed,
      exploration,
      compliant,
      status,
      searchName,
      searchFolder,
      searchId,
      searchText: `${searchName}\u0000${searchFolder}\u0000${searchId}`
    });
  }));
}

export function expandSelectedFolders(folderIds, folderIndex, includeRoot = true) {
  const expanded = new Set();
  for (const folderId of folderIds ?? []) {
    if (folderId === "__root__") {
      if (includeRoot) expanded.add("__root__");
      continue;
    }
    const values = folderIndex?.descendants?.get(folderId) ?? new Set([folderId]);
    for (const id of values) expanded.add(id);
  }
  return expanded;
}
