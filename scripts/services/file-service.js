// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import { FogPolicyError } from "../errors.js";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

function safeFilename(value) {
  return String(value ?? "runyth-fog-policy")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "runyth-fog-policy";
}

export function downloadJson(data, filename) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFilename(filename);
  anchor.style.display = "none";
  document.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function readJsonFile(file) {
  if (!(file instanceof File)) {
    throw new FogPolicyError("RFP-IMPORT-NOFILE", "No import file was selected.");
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new FogPolicyError(
      "RFP-IMPORT-SIZE",
      `Import file is ${(file.size / 1024 / 1024).toFixed(1)} MiB; maximum supported size is 5 MiB.`
    );
  }

  let text;
  try {
    text = await file.text();
  } catch (error) {
    throw new FogPolicyError("RFP-IMPORT-READ", "The selected file could not be read.", { cause: error });
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new FogPolicyError("RFP-IMPORT-JSON", "The selected file is not valid JSON.", { cause: error });
  }
}
