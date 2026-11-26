# src/data/selfevals — AI-written self-evaluation documents

One `.js` file per document, **same format as a lesson file** (see `../lessons/README.md`):
`slot` (the lesson it belongs to), `course`, `creditHours`, `blocks` — including `imageHint` blocks
(admin-only "put a picture here" notes; students never see them).

    node src/import-selfevals.js --offline   # check files, no database
    node src/import-selfevals.js             # dry run
    node src/import-selfevals.js --apply     # write to MongoDB

Optional extras: `priceEtb` (fixed price, used only when no credit hours / no credit-hour rate) and `isPublished`.
Existing documents that already have content are never overwritten unless you add `--force`.
