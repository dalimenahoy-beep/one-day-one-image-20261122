// One Day, One Image — Sunday 22 November 2026.
//
// Design: the poster itself was drawn at build time by the Python/PIL
// renderer (make_poster.py, kept as the drawing source for this entry) and
// the finished PNG is committed to this repository as entry.png. This
// program does no drawing at run time — it only places those bytes into the
// output directory — so it runs in a plain Node.js sandbox with no Python,
// no PIL, no network, no clocks and no randomness, and it never writes
// anywhere except the output directory (the repo may be read-only).
//
// Every run copies the same committed entry.png, so the output bytes are
// identical on every run.

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
copyFileSync(source, join(outDir, 'entry.png'));
