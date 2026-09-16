import { getAgentDir } from "@earendil-works/pi-coding-agent";
import factory from "./dist/index.ts";
import { withInitialSettings } from "./bootstrap.mjs";
export default withInitialSettings(factory, getAgentDir, {
  "file": "pi-plan-mode.json",
  "legacy": [
    "plan-mode.json"
  ],
  "settings": {
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
});
