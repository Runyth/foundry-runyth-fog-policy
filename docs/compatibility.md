# Compatibility

## Foundry VTT

Release 1.0.0 targets Foundry VTT v13 and declares:

```text
minimum: 13
verified: 13
maximum: 13
```

The maximum is intentional. Foundry v14 changes the Scene fog data model, including replacing the v13 boolean exploration representation with newer fog-mode semantics. A v14 compatibility release should be implemented and tested separately rather than allowing v13 enforcement code to run unverified.

## Game systems

The module does not read or write system data and is expected to work with any game system supported by Foundry v13.

## Other modules

Runyth Fog Policy uses public Scene/FogExploration APIs and namespaced flags. Potential interaction exists with modules that also enforce or rewrite Scene Fog Exploration settings.

When two modules intentionally enforce contradictory values, the resulting behavior is inherently conflict-prone. Prefer one authoritative fog-policy module.

## Compendium content

Compendium Scene documents are not modified in place. When a Scene is imported into the World, it becomes subject to the world policy.

## Official references

- <https://foundryvtt.com/api/v13/interfaces/foundry.documents.types.SceneData.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.Scene.html>
- <https://foundryvtt.com/api/v13/classes/foundry.documents.FogExploration.html>
- <https://foundryvtt.com/api/v13/modules/hookEvents.html>
