// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
const FIELD_ALIASES = Object.freeze({
  n: "name",
  name: "name",
  f: "folder",
  folder: "folder",
  s: "status",
  status: "status",
  fog: "fog",
  e: "exempt",
  exempt: "exempt",
  id: "id"
});

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

/**
 * Parse a compact query language while keeping ordinary text search intuitive.
 * Supports quoted values and field prefixes such as folder:"Dungeon Level 2".
 */
export function parseSearchQuery(query) {
  const source = String(query ?? "").trim();
  if (!source) return [];

  const tokens = [];
  const matcher = /(?:^|\s)(?:(?<field>[A-Za-z]+):)?(?:(?:"(?<quoted>(?:\\.|[^"])*)")|(?<bare>[^\s]+))/g;
  let match;
  while ((match = matcher.exec(source))) {
    const rawField = match.groups?.field?.toLocaleLowerCase();
    const field = rawField ? (FIELD_ALIASES[rawField] ?? null) : null;
    const rawValue = (match.groups?.quoted ?? match.groups?.bare ?? "").replace(/\\"/g, '"');
    // Unknown prefixes remain literal. Dropping an unsupported prefix such as
    // `tag:boss` would silently broaden the user's result set to `boss`.
    const searchValue = rawField && !field ? `${rawField}:${rawValue}` : rawValue;
    const value = normalizeText(searchValue);
    if (!value) continue;
    tokens.push(Object.freeze({ field, value, rawField: rawField ?? null }));
  }
  return tokens;
}

function tokenMatches(record, token) {
  switch (token.field) {
    case "name":
      return record.searchName.includes(token.value);
    case "folder":
      return record.searchFolder.includes(token.value);
    case "status":
      return record.status.toLocaleLowerCase().includes(token.value);
    case "fog":
      return (record.exploration ? "enabled on true" : "disabled off false").includes(token.value);
    case "exempt":
      return (record.exempt ? "yes true exempt" : "no false managed").includes(token.value);
    case "id":
      return record.searchId.includes(token.value);
    default:
      return record.searchText.includes(token.value);
  }
}

export function filterSceneRecords(records, filters) {
  const tokens = parseSearchQuery(filters?.query);
  const statuses = filters?.statuses instanceof Set ? filters.statuses : new Set();
  const fogStates = filters?.fogStates instanceof Set ? filters.fogStates : new Set();
  const folderIds = filters?.folderIds instanceof Set ? filters.folderIds : new Set();
  const selectedIds = filters?.selectedIds instanceof Set ? filters.selectedIds : new Set();
  const includeDescendants = filters?.includeDescendants !== false;
  const descendantFolderIds = filters?.descendantFolderIds instanceof Set
    ? filters.descendantFolderIds
    : new Set();

  return records.filter((record) => {
    if (statuses.size > 0 && !statuses.has(record.status)) return false;
    if (fogStates.size > 0 && !fogStates.has(record.exploration ? "enabled" : "disabled")) {
      return false;
    }
    if (filters?.selectedOnly && !selectedIds.has(record.id)) return false;

    if (folderIds.size > 0) {
      const acceptedFolders = includeDescendants ? descendantFolderIds : folderIds;
      if (!acceptedFolders.has(record.folderId ?? "__root__")) return false;
    }

    return tokens.every((token) => tokenMatches(record, token));
  });
}
