# Contributing

## Branch and commit conventions

The default branch is `master`.

Use capitalized Conventional-Commits-derived commit types, for example:

```text
Feat: Add policy dashboard filtering
Fix: Prevent duplicate Scene repair
Test: Cover imported Scene enforcement
Docs: Clarify destructive fog purge
Prog: Update deterministic packaging
```

Use `Prog:` instead of `Chore:` for repository, build, tooling, and maintenance work.

## Quality gates

Before proposing a change, run:

```text
npm ci
npm run check
```

Required properties:

- no syntax errors;
- no unresolved localization keys;
- no missing manifest paths;
- tests pass;
- install ZIP has one correct module root;
- source ZIP includes `.git` history;
- documentation ZIP contains no `module.json`;
- repeated packaging from unchanged source is byte-identical.

## Foundry APIs

Prefer documented Foundry v13 public APIs. Avoid private/internal methods unless no public alternative exists and the limitation is explicitly documented.
