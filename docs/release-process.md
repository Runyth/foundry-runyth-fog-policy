# Release Process

## Required tools

- Node.js 22+
- npm
- Python 3
- Git

## Commands

```text
npm ci
npm run lint
npm test
npm run build
npm run package
npm run release:verify
```

`npm run check` runs the full chain.

## Artifacts

For version `1.0.0`:

```text
runyth-fog-policy-1.0.0.zip
runyth-fog-policy-source-1.0.0.zip
runyth-fog-policy-docs-1.0.0.zip
```

### Installable ZIP

Contains exactly one `runyth-fog-policy/` directory and runtime-required files.

### Source ZIP

Contains the complete repository, including `.git` history, source, tests, tools, CI, and documentation. Generated `dist/` and transient files are excluded.

### Documentation ZIP

Contains README/changelog/license plus the `docs/` tree. It intentionally contains **no `module.json`**.

## Determinism

The packaging script uses sorted file order and fixed ZIP entry timestamps/permissions. Running packaging twice without changing the repository should produce byte-identical archives.

## Tagging

After all validation commits are complete:

```text
git tag -a v1.0.0 -m "Runyth Fog Policy v1.0.0"
```

Build final release archives from that exact tagged worktree state.
