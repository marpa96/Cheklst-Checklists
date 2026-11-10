# Cheklst checklists

The checklist library for the Cheklst app.

## Adding a checklist

1. Put a Markdown file in a category folder, for example `Travel/Packing list.md`. Each top-level folder becomes a category in the app.
2. Commit and push to `main`. The **Publish Cheklst library** action builds `library.json` on the `cheklst-library` branch.
3. In the app, go to Home → **Sync with GitHub** (it also syncs on launch).

Copy `CHECKLIST-TEMPLATE.md` as a starting point. Formatting:

- `- [ ] item` makes a checkbox. Indent by two spaces to nest.
- `## Heading` starts a section.
- `> note` adds a note; `> [!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` add colored notes.
- A ```` ```calc ```` block adds a calculation; see the template.
- The first `# Title` line is the checklist's name. Without one, the file name is used.
- A number at the start of a name sets the order and is hidden: `1. Travel/`, `02 Packing.md`.

Files at the top level (like this README), `README.md` files and dot-folders are ignored.

A checklist's identity is its file path. **Renaming or moving a file makes it a new checklist** in the app, and its "Save offline" setting starts over.

Test a build locally with `node .cheklst/build.mjs /tmp/library.json`.

This repository must be **public**, because the app reads it without a token.
