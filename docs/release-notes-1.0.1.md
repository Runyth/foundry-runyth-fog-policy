# Runyth Fog Policy 1.0.1 Release Notes

Release date: 2026-10-06

## Summary

Version 1.0.1 is a hardening and scalability patch. The policy behavior introduced in 1.0.0 remains the default, while bulk operations, error handling, dashboard filtering, backup/import-export, and large-World UI performance have been rebuilt for substantially better resilience.

## Hardening

- Scene updates are processed in bounded batches instead of one unbounded request.
- A failed batch is recursively isolated so one problematic Scene does not discard unrelated successful work.
- Repair, purge, and reset operations report partial failures accurately.
- Stable `RFP-*` error codes distinguish permissions, import, settings, Foundry API, and operation failures.
- Serious GM-facing failures produce concise persistent notifications with full diagnostic causes in the console.
- Active-GM coordination reduces duplicate automatic work in multi-GM sessions.
- Purge discovery no longer materializes a complete Scene × User query matrix in memory.

## Bulk Scene targeting

The dashboard now supports:

- multiple Scene-folder selection;
- optional descendant-folder inclusion;
- independent folder search;
- Scene search with quoted terms and structured fields;
- status and Fog Exploration filters;
- select-filtered, invert-filtered, and clear-selection operations;
- selected-only repair, exemption, and purge operations.

Structured query fields are `name:`, `folder:`, `status:`, `fog:`, `exempt:`, and `id:`. Common short aliases such as `n:` and `f:` are supported.

## Backup / import / export

- Export policy backup for selected or currently filtered Scenes.
- Optionally include Runyth Fog Policy world settings.
- Export/import a lightweight Scene selection file.
- Restore exemptions and Fog Exploration configuration where the active policy permits it.
- Optionally create a safety backup before applying an imported backup.
- Same-World imports prefer stable Scene IDs.
- Cross-World imports fall back only to a unique Scene-name + folder-path match.
- Ambiguous and unmatched entries are reported rather than guessed.
- Global-setting restore attempts rollback if a later setting write fails.

A Runyth Fog Policy backup intentionally does not contain Foundry's stored Fog Exploration texture/history. Use a normal Foundry World/data backup if that data must be recoverable after purge.

## Large-World dashboard

- Scene and folder results are rendered through bounded virtual/windowed lists.
- Only visible rows plus small overscan are present in the DOM.
- Scene/folder derived data is cached instead of recomputed for every selection event.
- Folder paths and descendants are indexed once per refresh.
- Search input is debounced.
- Scrolling work is scheduled through `requestAnimationFrame`.
- Dashboard transitions/animations are explicitly disabled.
- Large native drop-down controls are not used for Scene/folder selection.

The automated scale test currently exercises 10,000 synthetic Scenes and 500 nested folders.

## Compatibility

- Foundry VTT: minimum 13, verified 13, maximum 13.
- No external npm runtime or development dependencies are required.
- Existing 1.0.0 settings and Scene exemption flags remain compatible.
