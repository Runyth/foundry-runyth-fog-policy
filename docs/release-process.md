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

For version `<version>`:

```text
runyth-fog-policy-<version>.zip
runyth-fog-policy-source-<version>.zip
runyth-fog-policy-docs-<version>.zip
```

### Installable ZIP

Contains exactly one `runyth-fog-policy/` directory and runtime-required files.

### Source ZIP

Contains the complete repository, including `.git` history, source, tests, tools, CI, and documentation. Generated `dist/`, `node_modules/`, caches, and transient files are excluded.

### Documentation ZIP

Contains README/changelog/license plus the `docs/` tree. It intentionally contains **no `module.json`**.

## Determinism

The packaging script uses sorted file order, fixed ZIP entry timestamps/permissions, and a canonical Git index generated from `HEAD`. Running packaging twice without changing the repository—including after extracting the source ZIP—must produce byte-identical archives.

## Release gate

Before tagging:

1. ensure the worktree is clean except for the intended release changes;
2. run `npm ci`;
3. run `npm run check`;
4. run `git fsck --full`;
5. inspect all three archives;
6. extract the source ZIP into a clean directory;
7. verify `master`, Git history, and the intended exact tag state;
8. rerun lint/tests/build/package/verification from the extracted source;
9. compare SHA-256 values of all three rebuilt ZIPs against the originals.

## Tagging

After all implementation/documentation commits are complete:

```text
git tag -a v<version> -m "Runyth Fog Policy v<version>"
```

Build the final release archives from that exact tagged worktree state. Do not retag a different source state after publishing checksums.
