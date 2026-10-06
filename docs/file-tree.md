# Repository File Tree

```text
runyth-fog-policy/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── compatibility.md
│   ├── file-tree.md
│   ├── hardening-audit-1.0.1.md
│   ├── known-limitations.md
│   ├── manual-test-checklist.md
│   ├── release-notes-1.0.0.md
│   ├── release-notes-1.0.1.md
│   ├── release-process.md
│   ├── requirements-traceability.md
│   ├── security-and-data.md
│   ├── source-research.md
│   ├── user-guide.md
│   ├── validation-report.json
│   └── validation-report.md
├── lang/
│   ├── de.json
│   └── en.json
├── scripts/
│   ├── core/
│   │   ├── backup-core.js
│   │   ├── batch-core.js
│   │   ├── filter-core.js
│   │   └── scene-index-core.js
│   ├── services/
│   │   ├── backup-service.js
│   │   └── file-service.js
│   ├── ui/
│   │   └── virtual-list.js
│   ├── constants.js
│   ├── dashboard.js
│   ├── errors.js
│   ├── logger.js
│   ├── main.js
│   ├── policy-core.js
│   ├── policy.js
│   └── settings.js
├── styles/
│   └── runyth-fog-policy.css
├── templates/
│   └── dashboard.hbs
├── tests/
│   ├── backup-core.test.mjs
│   ├── batch-core.test.mjs
│   ├── filter-core.test.mjs
│   ├── manifest.test.mjs
│   ├── performance.test.mjs
│   ├── policy-core.test.mjs
│   ├── scene-index-core.test.mjs
│   └── static-hardening.test.mjs
├── tools/
│   ├── build.mjs
│   ├── lint.mjs
│   ├── package.mjs
│   ├── package_release.py
│   ├── verify-release.mjs
│   └── verify_archives.py
├── .editorconfig
├── .gitignore
├── .prettierrc.json
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── module.json
├── package-lock.json
└── package.json
```

The source release additionally contains the complete `.git/` repository history. Generated `dist/`, `node_modules/`, Python caches, and transient files are excluded from the source archive.
