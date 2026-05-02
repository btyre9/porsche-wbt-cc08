#!/usr/bin/env node
/**
 * extract-vo-cues.js
 * Reads VTT caption files for learning-objectives slides, detects per-objective
 * cue times from ordinal keywords ("First,", "Second,", etc.), and writes
 * VO-Cue-N fields into storyboard/course.md.
 *
 * Usage:
 *   node scripts/extract-vo-cues.js [--storyboard storyboard/course.md] [--force]
 *
 * Skips slides that already have all VO-Cue-N set unless --force is used.
 * Any objective whose ordinal cannot be found in the VTT is written as "null"
 * so it can be filled in manually.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth',
  'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
];

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    storyboard:  path.join('storyboard', 'course.md'),
    captionsDir: path.join('course', 'assets', 'captions'),
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--storyboard')   args.storyboard  = argv[++i];
    if (argv[i] === '--captions-dir') args.captionsDir = argv[++i];
    if (argv[i] === '--force')        args.force       = true;
  }
  return args;
}

// ---------------------------------------------------------------------------
// VTT parsing
// ---------------------------------------------------------------------------

function parseVttTime(str) {
  const parts = str.trim().split(':');
  let h = 0, m, s;
  if (parts.length === 3) {
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    s = parseFloat(parts[2]);
  } else {
    m = parseInt(parts[0], 10);
    s = parseFloat(parts[1]);
  }
  return h * 3600 + m * 60 + s;
}

function parseVtt(vttText) {
  const segments = [];
  const blocks   = vttText.split(/\n{2,}/);
  for (const block of blocks) {
    const lines    = block.trim().split('\n');
    const timeLine = lines.find(l => l.includes('-->'));
    if (!timeLine) continue;
    const [startStr, endStr] = timeLine.split('-->');
    const start = parseVttTime(startStr);
    const end   = parseVttTime(endStr);
    const text  = lines
      .filter(l => !l.includes('-->') && l.trim() !== 'WEBVTT' && !/^\d+$/.test(l.trim()))
      .join(' ')
      .trim();
    if (text) segments.push({ start, end, text });
  }
  return segments;
}

// ---------------------------------------------------------------------------
// Cue extraction
// ---------------------------------------------------------------------------

function findOrdinalCues(segments, count) {
  const cues = [];
  for (let i = 0; i < count; i++) {
    const ordinal = ORDINALS[i];
    if (!ordinal) { cues.push(null); continue; }

    // Match "First," / "first," / "And fifth," etc.
    const pattern = new RegExp(`(?:^|[\\s,])${ordinal}[,.]`, 'i');
    let found = false;

    for (const seg of segments) {
      const match = seg.text.match(pattern);
      if (match) {
        // Interpolate position within segment for a more accurate cue time
        const charOffset = match.index + (match[0].match(/^\s/) ? 1 : 0);
        const ratio      = charOffset / seg.text.length;
        const t          = seg.start + ratio * (seg.end - seg.start);
        cues.push(Math.round(t * 10) / 10);
        found = true;
        break;
      }
    }

    if (!found) cues.push(null);
  }
  return cues;
}

// ---------------------------------------------------------------------------
// course.md parsing
// ---------------------------------------------------------------------------

function parseSlides(lines) {
  const slides = [];
  let current  = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) {
      if (current) { current.endLine = i - 1; slides.push(current); }
      current = { startLine: i, endLine: -1, fields: {} };
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(':');
    if (colon > 0) {
      const key = line.slice(0, colon).trim();
      const val = line.slice(colon + 1).trim();
      if (current.fields[key] === undefined) current.fields[key] = val;
    }
  }
  if (current) { current.endLine = lines.length - 1; slides.push(current); }
  return slides;
}

// ---------------------------------------------------------------------------
// Inject VO-Cue-N lines into a slide block
// Removes any existing VO-Cue lines first, then inserts after last Objective-N.
// Returns a new lines array (original is not mutated).
// ---------------------------------------------------------------------------

function injectCues(lines, slide, cues) {
  const { startLine, endLine } = slide;
  const slideLines = lines.slice(startLine, endLine + 1);

  // Strip existing VO-Cue-N lines
  const filtered = slideLines.filter(l => !/^VO-Cue-\d+\s*:/.test(l.trim()));

  // Find last Objective-N line index within filtered slice
  let lastObjIdx = -1;
  for (let i = 0; i < filtered.length; i++) {
    if (/^Objective-\d+\s*:/.test(filtered[i].trim())) lastObjIdx = i;
  }
  if (lastObjIdx < 0) return lines;

  const cueLines = cues.map((t, i) =>
    `VO-Cue-${i + 1}: ${t !== null ? String(t) : 'null'}`
  );
  filtered.splice(lastObjIdx + 1, 0, ...cueLines);

  const result = [...lines];
  result.splice(startLine, endLine - startLine + 1, ...filtered);
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args   = parseArgs(process.argv.slice(2));
  const sbPath = path.resolve(args.storyboard);

  if (!fs.existsSync(sbPath)) {
    console.error(`Error: storyboard not found — ${sbPath}`);
    process.exit(1);
  }

  console.log(`\nExtracting VO cues from: ${path.basename(sbPath)}`);
  console.log('─'.repeat(60));

  let lines  = fs.readFileSync(sbPath, 'utf8').split('\n');
  const slides = parseSlides(lines);

  let updated = 0;
  let skipped = 0;

  // Process in reverse order so line numbers stay valid after splices
  const objSlides = slides
    .filter(s =>
      s.fields['Template-ID'] === 'learning-objectives' ||
      s.fields['Template-ID'] === 'objectives'
    )
    .reverse();

  for (const slide of objSlides) {
    const slideId = slide.fields['Slide-ID'];
    if (!slideId) continue;

    // Count objectives
    let objCount = 0;
    for (let i = 1; i <= 10; i++) {
      if (!slide.fields[`Objective-${i}`]) break;
      objCount++;
    }
    if (objCount === 0) {
      console.log(`  SKIP   ${slideId} — no Objective-N fields`);
      skipped++;
      continue;
    }

    // Skip if all cues already set and not forcing
    const allCuesSet = Array.from({ length: objCount }, (_, i) =>
      slide.fields[`VO-Cue-${i + 1}`]
    ).every(Boolean);

    if (allCuesSet && !args.force) {
      console.log(`  SKIP   ${slideId} — all cues already set (--force to overwrite)`);
      skipped++;
      continue;
    }

    // Locate VTT
    const sep     = slideId.includes('_') ? '_' : '-';
    const vttPath = path.resolve(args.captionsDir, `${slideId}${sep}INTRO.vtt`);
    if (!fs.existsSync(vttPath)) {
      console.log(`  SKIP   ${slideId} — VTT not found: ${path.basename(vttPath)}`);
      skipped++;
      continue;
    }

    // Extract cues from VTT
    const segments = parseVtt(fs.readFileSync(vttPath, 'utf8'));
    const cues     = findOrdinalCues(segments, objCount);

    console.log(`  WRITE  ${slideId}`);
    cues.forEach((t, i) =>
      console.log(`         VO-Cue-${i + 1}: ${t !== null ? t + 's' : 'not found — set manually'}`)
    );

    lines = injectCues(lines, slide, cues);
    updated++;
  }

  fs.writeFileSync(sbPath, lines.join('\n'), 'utf8');

  console.log('\n' + '─'.repeat(60));
  console.log(`Updated: ${updated}  |  Skipped: ${skipped}`);
  if (updated > 0) {
    console.log('\nNext step: npm run generate-slides -- --force');
  }
}

main();
