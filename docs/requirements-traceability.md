# Requirements Traceability

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Existing Scenes in bulk | `repairExistingScenes()` + bounded resilient `Scene.updateDocuments` batches | Unit tests + manual checklist |
| Future Scenes | `preCreateScene` + `updateSource` | Static audit + manual checklist |
| Imported world Scenes | Same create hook; compendium documents excluded | Manual checklist |
| Prevent re-enabling | `preUpdateScene` + defensive active-GM repair | Unit tests + manual checklist |
| Partial failure resilience | `runResilientBatches()` recursively isolates failed documents while preserving successful batches | Unit tests + manual checklist |
| Actionable errors | `FogPolicyError`, stable error codes, concise GM notifications + detailed console causes | Static audit + manual checklist |
| All users, no player noise | World policy; active-GM automatic repair; routine notifications GM-side | Manual checklist |
| Per-Scene exceptions | `flags.runyth-fog-policy.exempt` + bulk exemption APIs | Unit tests + manual checklist |
| Convenient bulk control | GM-only ApplicationV2 dashboard with selection-oriented operations | Static validation + manual checklist |
| Scene search | Cached normalized Scene index + AND query parser with quoted text and `name/folder/status/fog/exempt/id` fields | Unit tests |
| Folder search/selection | Cached hierarchy/path index, multiple folder selection, optional descendants | Unit tests + manual checklist |
| Scalable hierarchical controls | Windowed Scene and folder virtual lists; bounded scroll containers; no large native select controls | Source audit + manual checklist |
| Large-world performance | Cached derived records, virtualized rendering, bounded batching, lazy Fog Exploration discovery | 10,000-Scene performance test + manual checklist |
| Low-cost UI | Explicitly disabled dashboard transitions/animations; fixed-height virtual rows; requestAnimationFrame scroll updates | Static audit + manual checklist |
| Scene policy backup | Versioned JSON backup schema for selected/filtered Scene policy state and optional settings | Unit tests + manual checklist |
| Selection export/import | Versioned lightweight Scene-selection schema | Unit tests + manual checklist |
| Safe backup import | Schema/size validation, same-World ID matching, cross-World unique name+folder fallback, ambiguity reporting | Unit tests + manual checklist |
| Safer settings restore | Best-effort rollback if a later setting write fails | Source audit + manual checklist |
| Import safety copy | Optional pre-import backup before mutation | Manual checklist |
| Historical fog cleanup | Public `FogExploration` load/delete APIs with bounded-memory query discovery and resilient deletion | Static validation + manual checklist |
| Non-destructive default | Purge never called automatically; backup does not claim to preserve fog texture history | Source/docs audit |
| Persistent module state | Foundry settings + Scene flags, not module folder | Source audit |
| Foundry v13 public APIs | Scene, Folder, hooks, settings, users.activeGM, FogExploration, ApplicationV2 | Research document |
| Localization | English + German | Key-parity lint |
| No external npm dependencies | `package.json` / lockfile | `npm ci` + audit |
| Three ZIP releases | Deterministic packaging tool | Archive verifier |
| Source ZIP full Git history | `.git` included | Archive verifier + fresh extraction `git fsck` |
| Docs ZIP excludes `module.json` | Explicit documentation selection | Archive verifier |
| Default branch `master` | Git repository | Git validation |
| Capitalized commit convention | Repository history | Git log review |
