# Known Limitations

## Live Foundry acceptance

The repository's automated tests run outside the Foundry browser/server runtime. They validate pure policy logic, localization/manifest consistency, JavaScript syntax, and release archives, but they cannot prove browser-level Foundry behavior.

A complete live Foundry v13 acceptance matrix is provided in `manual-test-checklist.md` and must be executed in a disposable World for production deployment confidence.

## Conflicting policy modules

A separate module that deliberately re-enables Fog Exploration after Runyth Fog Policy acts can create a policy conflict. No module can safely guarantee precedence over arbitrary third-party post-update behavior without increasingly invasive interception.

## Orphaned FogExploration records

The purge operation discovers records through public Scene/User loads plus currently loaded FogExploration collection entries. Records that reference users no longer present in the World and are also not exposed through the loaded collection may not be discoverable through the public query surface used by this module. Normal current-user records are covered.

## Foundry v14+

This release is intentionally blocked above v13. A later compatibility release should translate policy semantics to the v14 fog-mode model and be tested independently.
