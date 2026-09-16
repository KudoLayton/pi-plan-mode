# pi-plan-mode

Independent Windows distribution of @narumitw/pi-plan-mode. Source and copyright notices are preserved; see [upstream documentation](UPSTREAM-README.md) and [provenance](provenance.json).

## Install

Requires Node.js >=22.19, npm, Git, PowerShell 7, and an unmodified Pi 0.85.1. Extensions run with Pi's OS permissions.

```powershell
pi install git:github.com/KudoLayton/pi-plan-mode@v0.1.0
```

This command becomes available after the public repository and tag are published. For a local smoke, use  `pi -e ./path/to/pi-plan-mode`. No build or source checkout is needed on the destination PC.

## First startup

The distribution initializes  `<getAgentDir()>/pi-plan-mode.json` before the original session-start handler, only when absent. Existing files (including malformed files) are never repaired or merged automatically. Existing legacy Plan settings also suppress initialization. Repeated startup and reload preserve preferences.

```json
{
  "thinkingLevel": "inherit",
  "defaultPlanTools": [
    "read",
    "powershell",
    "grep",
    "find",
    "ls",
    "obs_recall",
    "web_search",
    "write",
    "edit"
  ],
  "safeSubcommands": {
    "git": [
      "rev-parse",
      "blame",
      "describe",
      "merge-base",
      "ls-tree",
      "cat-file"
    ]
  }
}
```

This automatic initialization is an intentional distribution-specific setup action; upstream settings readers remain read-only. Each package initializes only its own settings. Pi settings, credentials, and other extensions are not copied or modified. Loading the package does not call a model.

Initialization uses a per-file directory lock and atomic rename. Locks coordinate these initializers across Pi processes, not unrelated editors. Do not edit the same missing settings file concurrently with first startup. An interrupted initializer can leave an empty  `pi-plan-mode.json.initializing` directory; after closing Pi processes, remove that directory and restart. Initialization errors are reported through Pi's extension error handling.

## Updates and removal

Install a newer explicit tag to upgrade; install a previous tag to roll back. These pinned releases do not move automatically to newer tags. Remove the exact source shown by  `pi list` with  `pi remove <source>`. User settings remain outside the package and survive removal. Do not simultaneously load the old local or upstream copy of the same extension.

## License

[MIT](LICENSE). Upstream license and third-party notices are included.
