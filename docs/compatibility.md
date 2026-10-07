# Compatibility

## Foundry VTT

Release 1.0.2 targets Foundry VTT v13 and declares:

```text
minimum: 13
verified: 13
maximum: 13
```

The maximum is intentional. Foundry v14 changes the Scene fog data model, so v13 enforcement code is not allowed to run unverified on v14.

## Game systems

The module does not read or write game-system data and is expected to work with any game system supported by Foundry v13.

## Browsers and UI

The dashboard uses the Foundry v13 ApplicationV2 framework and standard modern browser APIs available to supported Foundry clients. It has no UI-framework dependency and does not require jQuery.

## Other modules

Runyth Fog Policy uses public Scene/FogExploration APIs and namespaced flags. Modules that intentionally enforce a contradictory Fog Exploration value may still conflict; prefer one authoritative fog-policy module.

## Compendium content

Compendium Scene documents are not modified in place. An imported copy becomes a World Scene and is subject to world policy.
