// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";

import {
  extractWindowState,
  normalizeWindowState
} from "../scripts/core/window-state-core.js";

test("window geometry extracts only stable numeric fields", () => {
  assert.deepEqual(
    extractWindowState({ left: 101.4, top: 55.7, width: 1000.2, height: 700.9, scale: 1.5 }),
    { left: 101, top: 56, width: 1000, height: 701 }
  );
  assert.equal(extractWindowState({ left: 0, top: 0 }), null);
});

test("saved dashboard geometry is restored inside the current viewport", () => {
  assert.deepEqual(
    normalizeWindowState(
      { left: 160, top: 90, width: 980, height: 720 },
      { viewportWidth: 1920, viewportHeight: 1080 }
    ),
    { left: 160, top: 90, width: 980, height: 720 }
  );
});

test("off-screen geometry is clamped after a monitor or resolution change", () => {
  assert.deepEqual(
    normalizeWindowState(
      { left: 2500, top: 1400, width: 1500, height: 1200 },
      { viewportWidth: 1280, viewportHeight: 720 }
    ),
    { left: 24, top: 24, width: 1232, height: 672 }
  );
});

test("first open keeps left and top undefined so Foundry can center natively", () => {
  assert.deepEqual(
    normalizeWindowState(null, { viewportWidth: 1920, viewportHeight: 1080 }),
    { width: 1040, height: 820 }
  );
});

test("very small viewports keep the dashboard reachable instead of enforcing desktop minima", () => {
  assert.deepEqual(
    normalizeWindowState(
      { left: 50, top: 50, width: 1040, height: 820 },
      { viewportWidth: 480, viewportHeight: 360 }
    ),
    { left: 24, top: 24, width: 432, height: 312 }
  );
});


test("extremely small viewports never restore a window larger than the viewport", () => {
  const state = normalizeWindowState(
    { left: 900, top: 700, width: 1040, height: 820 },
    { viewportWidth: 300, viewportHeight: 220 }
  );

  assert.ok(state.width <= 300);
  assert.ok(state.height <= 220);
  assert.ok((state.left ?? 0) + state.width <= 300);
  assert.ok((state.top ?? 0) + state.height <= 220);
});
