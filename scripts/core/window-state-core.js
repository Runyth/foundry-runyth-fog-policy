// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Runyth. See the LICENSE file for rights and obligations.
const DEFAULT_MARGIN = 24;
const MIN_WIDTH = 620;
const MIN_HEIGHT = 500;
const FALLBACK_WIDTH = 1040;
const FALLBACK_HEIGHT = 820;

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Extract only the stable geometry fields we persist between sessions.
 * Foundry's ApplicationPosition may contain additional runtime-only fields.
 */
export function extractWindowState(position) {
  if (!position || typeof position !== "object") return null;

  const width = finiteNumber(position.width);
  const height = finiteNumber(position.height);
  const left = finiteNumber(position.left);
  const top = finiteNumber(position.top);
  if (width === null || height === null) return null;

  const state = {
    width: Math.round(width),
    height: Math.round(height)
  };
  if (left !== null) state.left = Math.round(left);
  if (top !== null) state.top = Math.round(top);
  return Object.freeze(state);
}

/**
 * Restore saved geometry while guaranteeing that the window remains reachable
 * after monitor, resolution, browser zoom, or desktop-layout changes.
 */
export function normalizeWindowState(
  rawState,
  {
    viewportWidth,
    viewportHeight,
    margin = DEFAULT_MARGIN,
    minWidth = MIN_WIDTH,
    minHeight = MIN_HEIGHT,
    fallbackWidth = FALLBACK_WIDTH,
    fallbackHeight = FALLBACK_HEIGHT
  } = {}
) {
  const requestedViewportWidth = finiteNumber(viewportWidth);
  const requestedViewportHeight = finiteNumber(viewportHeight);
  const vw = requestedViewportWidth !== null && requestedViewportWidth > 0
    ? requestedViewportWidth
    : fallbackWidth;
  const vh = requestedViewportHeight !== null && requestedViewportHeight > 0
    ? requestedViewportHeight
    : fallbackHeight;

  const requestedMargin = clamp(finiteNumber(margin) ?? DEFAULT_MARGIN, 0, 96);
  // Never reserve so much margin that the restored window is forced beyond the
  // actual viewport. This also keeps unusually small embedded/browser windows
  // recoverable rather than assuming a desktop-sized minimum viewport.
  const safeMargin = Math.min(
    requestedMargin,
    Math.max(0, (vw - 1) / 2),
    Math.max(0, (vh - 1) / 2)
  );

  const maxWidth = Math.max(1, vw - safeMargin * 2);
  const maxHeight = Math.max(1, vh - safeMargin * 2);
  const safeMinWidth = Math.min(Math.max(1, finiteNumber(minWidth) ?? MIN_WIDTH), maxWidth);
  const safeMinHeight = Math.min(Math.max(1, finiteNumber(minHeight) ?? MIN_HEIGHT), maxHeight);

  const rawWidth = finiteNumber(rawState?.width) ?? fallbackWidth;
  const rawHeight = finiteNumber(rawState?.height) ?? fallbackHeight;
  const width = Math.round(clamp(rawWidth, safeMinWidth, maxWidth));
  const height = Math.round(clamp(rawHeight, safeMinHeight, maxHeight));

  const result = { width, height };
  const rawLeft = finiteNumber(rawState?.left);
  const rawTop = finiteNumber(rawState?.top);

  // Leave left/top undefined for a never-positioned window so Foundry can apply
  // its native first-open centering behavior.
  if (rawLeft !== null) {
    const maxLeft = Math.max(0, vw - width - safeMargin);
    result.left = Math.round(clamp(rawLeft, Math.min(safeMargin, maxLeft), maxLeft));
  }
  if (rawTop !== null) {
    const maxTop = Math.max(0, vh - height - safeMargin);
    result.top = Math.round(clamp(rawTop, Math.min(safeMargin, maxTop), maxTop));
  }

  return Object.freeze(result);
}
