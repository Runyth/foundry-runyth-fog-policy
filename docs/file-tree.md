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
│   ├── known-limitations.md
│   ├── manual-test-checklist.md
│   ├── release-notes-1.0.0.md
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
│   ├── constants.js
│   ├── dashboard.js
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
│   ├── manifest.test.mjs
│   └── policy-core.test.mjs
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

The source release additionally contains the complete `.git/` repository history. Generated `dist/` output and `node_modules/` are excluded from the source archive.
