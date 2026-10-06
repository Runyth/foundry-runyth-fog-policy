# Requirements Traceability

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Existing Scenes in bulk | `repairExistingScenes()` + `Scene.updateDocuments` | Unit tests + manual checklist |
| Future Scenes | `preCreateScene` + `updateSource` | Static audit + manual checklist |
| Imported world Scenes | Same create hook; compendium documents excluded | Manual checklist |
| Prevent re-enabling | `preUpdateScene` + defensive post-update repair | Unit tests + manual checklist |
| All users, no player noise | World policy; active-GM automatic repair; notifications GM-side | Manual checklist |
| Per-Scene exceptions | `flags.runyth-fog-policy.exempt` | Unit tests + manual checklist |
| Convenient control | GM-only ApplicationV2 dashboard | Static validation + manual checklist |
| Historical fog cleanup | Public `FogExploration.load` and document deletion APIs | Static validation + manual checklist |
| Non-destructive default | Purge never called automatically | Source audit |
| Persistent module state | Foundry settings + Scene flags, not module folder | Source audit |
| Foundry v13 public APIs | Scene, hooks, settings, FogExploration, ApplicationV2 | Research document |
| Localization | English + German | Key-parity lint |
| No external npm dependencies | `package.json` / lockfile | `npm ci` + audit |
| Three ZIP releases | Deterministic packaging tool | Archive verifier |
| Source ZIP full Git history | `.git` included | Archive verifier |
| Docs ZIP excludes `module.json` | Explicit documentation selection | Archive verifier |
| Default branch `master` | Git repository | Git validation |
| Capitalized commit convention | Repository history | Git log review |
