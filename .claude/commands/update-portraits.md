---
description: Make web-sized JPGs in public/portraits from every image in "original portraits"
argument-hint: "[--force] [--dry-run]"
allowed-tools: Bash(npm run update-portraits:*)
---

Run `npm run update-portraits -- $ARGUMENTS` from the project root.

The script (scripts/resize-portraits.mjs) writes a JPG (max 960 px wide, quality 82) to
public/portraits for each image in "original portraits", skipping ones that are already up to date.

Afterwards, report briefly: which files were written, which originals were skipped as duplicates,
and any errors. Do not change data/champions.json or anything else.
