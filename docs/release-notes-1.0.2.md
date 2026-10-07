# Runyth Fog Policy 1.0.2 Release Notes

Release date: **2026-10-07**

## Summary

Version 1.0.2 is a dashboard UX and reliability patch. It keeps the v1.0.1 policy engine, resilient bulk operations, virtualized large-world lists, filtering, and backup/import-export behavior intact while rebuilding the dashboard shell around smaller-window usability.

## Dashboard geometry persistence

The dashboard now stores its last stable `left`, `top`, `width`, and `height` in a hidden **client-scope** Foundry setting. Position writes are debounced while dragging/resizing and flushed during ApplicationV2's awaited pre-close lifecycle.

Saved geometry is validated and clamped to the current browser viewport before use. If a user moves from a large/multi-monitor desktop to a smaller viewport, the dashboard is kept reachable rather than reopening off-screen.

A client setting is intentional: window geometry depends on the device/browser display environment and should not become a world-wide GM policy setting.

## Layout rework

The former persistent filter sidebar has been removed. The dashboard now uses:

1. compact policy status and responsive counters;
2. primary bulk action toolbar;
3. full-width Scene search;
4. inline quick filters for policy status, Fog Exploration, and selected-only state;
5. an on-demand **Scene Folders** drawer containing the same searchable, scrollable, virtualized hierarchy;
6. a dedicated selection toolbar;
7. the Scene list as the dominant remaining workspace;
8. backup/import-export collapsed by default.

At narrower widths the Scene list hides redundant full columns and shows the same Fog/status information as compact metadata under the Scene name. No large native dropdowns were introduced.

## Dashboard help

A Foundry ApplicationV2 header control with a question-mark icon opens a separate **Dashboard Help** window. It documents:

- the recommended filter → select → act workflow;
- structured search fields and quoted searches;
- hierarchical folder filtering and descendant inclusion;
- bulk repair/exemption/management/purge actions;
- backup/import-export and cross-world matching behavior;
- purge safety limitations;
- window size/position persistence.

## Performance

The release preserves v1.0.1's fixed-row virtualization for Scene and folder lists and adds no per-Scene render work outside visible virtual rows. Folder UI is hidden until requested, and geometry persistence uses debounced client-setting writes instead of writing on every pointer movement.

## Compatibility

- Foundry VTT minimum: **13**
- Foundry VTT verified: **13**
- Foundry VTT maximum: **13**
- Game-system dependencies: **none**
- Required modules: **none**

Live Foundry browser acceptance remains a manual gate because a Foundry v13 runtime is not available in the build environment.
