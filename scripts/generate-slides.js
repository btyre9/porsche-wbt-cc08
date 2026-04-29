#!/usr/bin/env node
/**
 * generate-slides.js
 * Reads storyboard/course.md and generates production-ready HTML slide files.
 *
 * Usage:
 *   node scripts/generate-slides.js [--storyboard storyboard/course.md] [--force]
 *
 * Outputs:
 *   course/slides/{SLIDE_ID}.html        — one per slide (skipped if exists, unless --force)
 *   course/data/course.data.json         — rewrites slides[] + quiz; preserves meta
 *   course/data/kc-review.json           — KC slide ID → review slide array map
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    storyboard: path.join('storyboard', 'course.md'),
    slidesDir:  path.join('course', 'slides'),
    dataDir:    path.join('course', 'data'),
    templatesDir: path.join('scripts', 'templates'),
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--storyboard') args.storyboard  = argv[++i];
    if (argv[i] === '--slides-dir') args.slidesDir   = argv[++i];
    if (argv[i] === '--force')      args.force        = true;
  }
  return args;
}

// ---------------------------------------------------------------------------
// Parse storyboard/course.md
// ---------------------------------------------------------------------------

function parseCourseMd(mdPath) {
  const text  = fs.readFileSync(mdPath, 'utf8');
  const lines = text.split('\n');

  let courseTitle = 'Untitled Course';
  const slides    = [];
  let current     = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === '---') continue;

    // Course title line: "# Course: Module Name"
    const courseTitleMatch = line.match(/^#\s+Course:\s*(.+)$/i);
    if (courseTitleMatch) {
      courseTitle = courseTitleMatch[1].trim();
      continue;
    }

    // Slide heading: "## Slide 01 — Title"
    if (line.startsWith('## ')) {
      if (current) slides.push(current);
      current = { _heading: line.slice(3).trim() };
      continue;
    }

    if (!current) continue;

    // Stage directions (ignored)
    if (line.startsWith('>>')) continue;

    // Key: Value lines
    const colon = line.indexOf(':');
    if (colon > 0) {
      const key   = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      if (current[key] !== undefined) {
        // Continuation — append
        current[key] += ' ' + value;
      } else {
        current[key] = value;
      }
    }
  }

  if (current) slides.push(current);

  // Normalise slide entries
  slides.forEach((slide, idx) => {
    slide['Slide-ID']    = slide['Slide-ID']    || `slide_${String(idx + 1).padStart(2, '0')}`;
    slide['Template-ID'] = slide['Template-ID'] || 'content-split';
    slide['Slide-Title'] = slide['Slide-Title'] || slide._heading || `Slide ${idx + 1}`;
  });

  return { courseTitle, slides };
}

// ---------------------------------------------------------------------------
// Build audio VO path from Slide-ID
// Returns path relative to the SLIDE file (e.g. "../assets/audio/vo/SLD_XX01_001_INTRO.mp3")
// and player path (no leading ../) used in course.data.json
// ---------------------------------------------------------------------------

function resolveAudioPaths(slideId) {
  // Detect separator from the slide ID:
  //   underscore format: SLD_CC02_001 → SLD_CC02_001_INTRO.mp3
  //   hyphen format:     SLD-CC02-001 → SLD-CC02-001-INTRO.mp3
  const sep      = slideId.includes('_') ? '_' : '-';
  const fileName = slideId + sep + 'INTRO.mp3';
  return {
    slidePath:  '../assets/audio/vo/' + fileName,
    playerPath: 'assets/audio/vo/'    + fileName,
  };
}

// ---------------------------------------------------------------------------
// Extract CLICK trigger labels from a slide's Voiceover-CLICK-* keys
// Returns [ { label: "CardOne", audioSlide: "../assets/audio/..." }, ... ]
// ---------------------------------------------------------------------------

function extractClickTriggers(slide, slideId) {
  const sep      = slideId.includes('_') ? '_' : '-';
  const triggers = [];
  for (const [key] of Object.entries(slide)) {
    const m = key.match(/^Voiceover-CLICK-(.+)$/);
    if (!m) continue;
    const label = m[1];
    triggers.push({
      label,
      audioPath: `../assets/audio/vo/${slideId}${sep}CLICK${sep}${label}.mp3`,
    });
  }
  return triggers;
}

// ---------------------------------------------------------------------------
// Bullet list items (content-split template)
// ---------------------------------------------------------------------------

function buildBulletListHtml(bodyText) {
  if (!bodyText || !bodyText.trim()) return '            <!-- no bullets -->';
  return bodyText.split('|')
    .map(s => s.trim()).filter(Boolean)
    .map(text =>
      `            <li><span class="bullet-dot" aria-hidden="true"></span>` +
      `<span>${escHtml(text)}</span></li>`
    )
    .join('\n');
}

// Builds the JS array of VO cue times — one null per bullet, with TODO comments.
// Left column bullets come first, then right column.
function buildBulletTimesArray(leftBody, rightBody) {
  const parse = b => b ? b.split('|').map(s => s.trim()).filter(Boolean) : [];
  const left  = parse(leftBody);
  const right = parse(rightBody);
  if (!left.length && !right.length) return '[]';
  const entries = [
    ...left.map( (_, i) => `  null  /* TODO L${i + 1}: cue time in seconds after VO recording */`),
    ...right.map((_, i) => `  null  /* TODO R${i + 1}: cue time in seconds after VO recording */`),
  ];
  return '[\n' + entries.join(',\n') + '\n]';
}

// Builds the optional callout box HTML, or returns empty string.
function buildCalloutHtml(slide) {
  const text  = (slide['Callout-Text']  || '').trim();
  if (!text) return '';
  const label = (slide['Callout-Label'] || '').trim();
  const content = label
    ? `<strong>${escHtml(label)}:</strong> ${escHtml(text)}`
    : escHtml(text);
  return (
    `      <div class="callout-box anim-block" id="el-callout">\n` +
    `        <p>${content}</p>\n` +
    `      </div>`
  );
}

// ---------------------------------------------------------------------------
// Objective items
// ---------------------------------------------------------------------------

function buildObjectivesHtml(slide) {
  const items = [];
  for (let i = 1; i <= 10; i++) {
    const text = slide[`Objective-${i}`];
    if (!text) break;
    const num = String(i).padStart(2, '0');
    items.push(
      `      <li class="obj-item" id="obj-${i}">\n` +
      `        <span class="obj-number">${num}</span>\n` +
      `        <span class="obj-text">${escHtml(text)}</span>\n` +
      `      </li>`
    );
  }
  if (items.length === 0) {
    for (let i = 1; i <= 3; i++) {
      const num = String(i).padStart(2, '0');
      items.push(
        `      <li class="obj-item" id="obj-${i}">\n` +
        `        <span class="obj-number">${num}</span>\n` +
        `        <span class="obj-text"><!-- Objective ${i}: replace with actual objective --></span>\n` +
        `      </li>`
      );
    }
  }
  return items.join('\n');
}

function buildObjectivesIdsJs(slide) {
  const ids = [];
  for (let i = 1; i <= 10; i++) {
    if (!slide[`Objective-${i}`]) break;
    ids.push(`'obj-${i}'`);
  }
  if (ids.length === 0) ids.push("'obj-1'", "'obj-2'", "'obj-3'");
  return '[' + ids.join(', ') + ']';
}

function buildVoCueTimesJs(slide) {
  const nulls = [];
  for (let i = 1; i <= 10; i++) {
    if (!slide[`Objective-${i}`]) break;
    nulls.push('null');
  }
  if (nulls.length === 0) nulls.push('null', 'null', 'null');
  return '[' + nulls.join(', ') + ']';
}

// ---------------------------------------------------------------------------
// Card items (card-explore template)
// ---------------------------------------------------------------------------

function buildCardsHtml(triggers) {
  const letters = ['01', '02', '03', '04', '05', '06'];
  return triggers.map((t, idx) => {
    const num   = letters[idx] || String(idx + 1).padStart(2, '0');
    const title = camelToWords(t.label);
    return (
      `      <div class="explore-card pds-card" data-card="${escAttr(t.label)}" id="card-${escAttr(t.label)}" tabindex="0" role="button" aria-label="Explore ${escAttr(title)}">\n` +
      `        <div class="card-number">${num}</div>\n` +
      `        <div class="card-title">${escHtml(title)}</div>\n` +
      `        <div class="card-body"><!-- Add card detail content here --></div>\n` +
      `        <div class="card-chip">Explore &rarr;</div>\n` +
      `      </div>`
    );
  }).join('\n');
}

function buildCardAudioMap(triggers) {
  const entries = triggers.map(t => `  '${t.label}': '${t.audioPath}'`);
  return '{\n' + entries.join(',\n') + '\n}';
}

// Generates an inline <script> block that:
//  1. Sends sandbox-configure-interactions synchronously on DOMContentLoaded so
//     the player knows which cards are required BEFORE the VO can end.
//  2. Wires up each card's click/keydown handler to send sandbox-play-interaction
//     with the correct audio src and the card's ID for interaction tracking.
//  3. Listens for player-interaction-progress to mark visited cards visually.
// This must run before the VO finishes to avoid the premature Click_Next bug.
function buildCardInitScript(triggers) {
  if (!triggers.length) return '';
  const requiredIds = JSON.stringify(triggers.map(t => t.label));
  const audioMap    = triggers.map(t => `  ${JSON.stringify(t.label)}: ${JSON.stringify(t.audioPath)}`).join(',\n');
  return `<script>
(function () {
  var AUDIO_MAP = {
${audioMap}
  };
  var requiredIds = ${requiredIds};

  // Tell the player which cards are required and to lock Next until all are visited.
  // Done synchronously so the player is configured before the VO can end.
  window.parent.postMessage({
    type: 'sandbox-configure-interactions',
    requiredIds: requiredIds,
    finalCueSrc: 'assets/audio/vo/Click_Next.mp3',
    lockNextUntilComplete: true
  }, '*');

  function playCard(label) {
    var src = AUDIO_MAP[label];
    if (!src) return;
    window.parent.postMessage({
      type: 'sandbox-play-interaction',
      src: src,
      id: label,
      pauseNarration: true,
      resumeNarration: true
    }, '*');
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.explore-card').forEach(function (card) {
      var label = card.getAttribute('data-card');
      card.addEventListener('click', function () { playCard(label); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playCard(label); }
      });
    });
  });

  // Mark visited cards visually when the player reports progress.
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'player-interaction-progress') return;
    var card = document.getElementById('card-' + e.data.id);
    if (card) card.classList.add('visited');
  });
}());
</script>`;
}

// ---------------------------------------------------------------------------
// Choice items (KC / FQ templates)
// ---------------------------------------------------------------------------

function buildChoicesHtml(slide, templateId) {
  if (templateId === 'knowledge-check') {
    return buildKCChoicesHtml(slide);
  }
  // final-quiz and others: numeric data-choice format
  const choiceClass = templateId === 'final-quiz' ? 'fq-choice' : 'kc-choice';
  const letterClass = templateId === 'final-quiz' ? 'fq-choice-letter' : 'kc-choice-letter';
  const textClass   = templateId === 'final-quiz' ? 'fq-choice-text' : 'kc-choice-text';
  const letters     = ['A', 'B', 'C', 'D'];
  const items       = [];

  for (let i = 1; i <= 4; i++) {
    const text = slide[`Choice-${i}`] || `Choice ${i}`;
    items.push(
      `      <div class="${choiceClass}" data-choice="${i}" role="button" tabindex="0">\n` +
      `        <span class="${letterClass}">${letters[i - 1]}</span>\n` +
      `        <span class="${textClass}">${escHtml(text)}</span>\n` +
      `      </div>`
    );
  }
  return items.join('\n');
}

// KC choices: .option-row format with data-correct="true" on the correct item.
// JS in the template shuffles rows and re-assigns A–D labels at runtime.
function buildKCChoicesHtml(slide) {
  const letters    = ['A', 'B', 'C', 'D'];
  const correctIdx = (parseInt(slide['Correct-Answer'], 10) || 1) - 1; // 0-based
  const items      = [];

  for (let i = 0; i < 4; i++) {
    const text      = slide[`Choice-${i + 1}`] || `Choice ${i + 1}`;
    const correct   = i === correctIdx ? ' data-correct="true"' : '';
    items.push(
      `      <div class="option-row"${correct} data-value="${letters[i]}" role="radio" aria-checked="false" tabindex="0">\n` +
      `        <div class="option-row__letter">${letters[i]}</div>\n` +
      `        <span class="option-row__text">${escHtml(text)}</span>\n` +
      `      </div>`
    );
  }
  return items.join('\n');
}

// ---------------------------------------------------------------------------
// Stat value / label split
// e.g. "94% Customer Satisfaction" → { value: "94%", label: "Customer Satisfaction" }
// e.g. "Service excellence starts here" → { value: slide title, label: text }
// ---------------------------------------------------------------------------

function splitStat(onScreenText, slideTitle) {
  if (!onScreenText) return { value: slideTitle, label: '' };
  const m = onScreenText.match(/^(\d[\d,.%×x]*)\s+(.+)$/);
  if (m) return { value: m[1], label: m[2] };
  return { value: onScreenText, label: '' };
}

// ---------------------------------------------------------------------------
// FQ question number (count FQ slides seen so far, excluding SCORE slide)
// ---------------------------------------------------------------------------

function fqQuestionNumber(allSlides, currentSlideId) {
  let count = 0;
  for (const s of allSlides) {
    const id = s['Slide-ID'] || '';
    if (!/^FQ[_-]/i.test(id)) continue;
    if (/[_-]SCORE$/i.test(id)) continue;
    count++;
    if (id === currentSlideId) break;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

function renderTemplate(html, tokens) {
  return html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : match;
  });
}

// ---------------------------------------------------------------------------
// Build token map for a slide
// ---------------------------------------------------------------------------

function extractTabTriggers(slide, slideId) {
  const sep = slideId.includes('_') ? '_' : '-';
  const triggers = [];
  for (const [key] of Object.entries(slide)) {
    const m = key.match(/^Voiceover-TAB-(.+)$/);
    if (!m) continue;
    const label = m[1];
    const body  = slide[`Tab-Body-${label}`] || slide[key] || '';
    triggers.push({
      label,
      title:     camelToWords(label),
      body,
      audioPath: `../assets/audio/vo/${slideId}${sep}TAB${sep}${label}.mp3`,
    });
  }
  return triggers;
}

function buildTabButtonsHtml(triggers) {
  return triggers.map((t, i) =>
    `      <button class="tab-btn${i === 0 ? ' is-active' : ''}" ` +
    `data-tab="${escAttr(t.label)}" data-audio="${escAttr(t.audioPath)}" ` +
    `role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}">${escHtml(t.title)}</button>`
  ).join('\n');
}

function buildTabPanelsHtml(triggers) {
  return triggers.map((t, i) =>
    `      <div class="tab-panel${i === 0 ? ' is-active' : ''}" id="panel-${escAttr(t.label)}" role="tabpanel">\n` +
    `        <p class="tab-panel__body">${escHtml(t.body)}</p>\n` +
    `      </div>`
  ).join('\n');
}

function buildTabAudioMap(triggers) {
  const entries = triggers.map(t => `  '${t.label}': '${t.audioPath}'`);
  return '{\n' + entries.join(',\n') + '\n}';
}

function buildBulletsHtml(slide) {
  const items = [];
  for (let i = 1; i <= 10; i++) {
    const text = slide[`Bullet-${i}`];
    if (!text) break;
    items.push(
      `            <li><span class="bullet-dot" aria-hidden="true"></span>` +
      `<span>${escHtml(text)}</span></li>`
    );
  }
  return items.length ? items.join('\n') : '            <!-- no bullets -->';
}

function buildTokens(slide, allSlides, courseTitle, templateHtml) {
  const slideId     = slide['Slide-ID'];
  const templateId  = slide['Template-ID'];
  const slideTitle  = slide['Slide-Title'] || slideId;
  const onScreen    = slide['On-Screen-Text'] || '';
  const imageFile   = slide['Image-File'];
  const imageSrc    = imageFile ? `../assets/images/${imageFile}` : null;
  const imagePath   = imageSrc || '../assets/images/placeholder.webp';

  const { value: statValue, label: statLabel } = splitStat(onScreen || slideTitle, slideTitle);
  const clicks = extractClickTriggers(slide, slideId);
  const tabs   = extractTabTriggers(slide, slideId);

  // content-quote tokens
  const quoteText            = slide['Quote']             || onScreen;
  const quoteAttributionName = slide['Quote-Attribution'] || '<!-- Attribution name -->';
  const quoteAttributionTitle= slide['Quote-Title']       || '<!-- Attribution title / role -->';

  // hero-title subtitle
  const onScreenParts = (slide['On-Screen-Text'] || '').split('|');
  const heroSubtitle  = slide['Hero-Subtitle'] || (onScreenParts[1] ? onScreenParts[1].trim() : '');

  // Pull-Quote or plain body paragraph
  const pullQuoteText = slide['Pull-Quote'];
  let bodyContentHtml;
  if (pullQuoteText) {
    bodyContentHtml =
      `<blockquote class="pull-quote">\n` +
      `        ${escHtml(pullQuoteText)}\n` +
      `      </blockquote>`;
  } else {
    bodyContentHtml = `<p class="pds-body">${escHtml(onScreen)}</p>`;
  }

  // Image HTML — img with onerror placeholder fallback
  const imageHtml = imageSrc
    ? `<img src="${escAttr(imageSrc)}" alt="" draggable="false">`
    : '';

  const eyebrow = slide['Eyebrow'] || courseTitle;

  // KC / FQ per-option tokens
  const correctNum = parseInt(slide['Correct-Answer'], 10) || 1;
  const correctIdx = correctNum - 1;

  // FQ label tokens
  const fqNum = fqQuestionNumber(allSlides, slideId);

  // quiz-score session storage key: FQ_CC08_SCORE → FQ_CC08_results
  const quizResultsKey = slideId
    .replace(/_SCORE$/i, '_results')
    .replace(/-SCORE$/i, '-results');

  const tokens = {
    SLIDE_ID:       slideId,
    SLIDE_TITLE:    escHtml(slideTitle),
    EYEBROW:        escHtml(eyebrow),
    ON_SCREEN_TEXT: escHtml(onScreen),
    HERO_SUBTITLE:  escHtml(heroSubtitle),
    MODULE_LABEL:   escHtml(courseTitle),
    IMAGE_PATH:     imagePath,
    IMAGE_FILE:     imageFile || 'placeholder.webp',
    IMAGE_HTML:     imageHtml,
    QUIZ_RESULTS_KEY: quizResultsKey,
    // Stat template
    STAT_VALUE:     escHtml(statValue),
    STAT_LABEL:     escHtml(statLabel),
    // Quote template
    QUOTE_TEXT:               escHtml(quoteText),
    QUOTE_ATTRIBUTION_NAME:   escHtml(quoteAttributionName),
    QUOTE_ATTRIBUTION_TITLE:  escHtml(quoteAttributionTitle),
    // Objectives template
    OBJECTIVES_HTML:    buildObjectivesHtml(slide),
    OBJECTIVES_IDS_JS:  buildObjectivesIdsJs(slide),
    VO_CUE_TIMES_JS:    buildVoCueTimesJs(slide),
    INTRO_TEXT:         escHtml(onScreen),
    // content-bullets / content-split two-col
    COL_LEFT_HEADER:      escHtml(slide['Col-Left-Header']  || ''),
    COL_RIGHT_HEADER:     escHtml(slide['Col-Right-Header'] || ''),
    COL_LEFT_BULLETS:     buildBulletListHtml(slide['Col-Left-Body']),
    COL_RIGHT_BULLETS:    buildBulletListHtml(slide['Col-Right-Body']),
    BULLETS_HTML:         buildBulletsHtml(slide),
    CALLOUT_HTML:         buildCalloutHtml(slide),
    BULLET_TIMES_ARRAY:   buildBulletTimesArray(slide['Col-Left-Body'], slide['Col-Right-Body']),
    CALLOUT_CUE_TIME:     'null  /* TODO: callout emphasis cue time in seconds */',
    // Card-explore template
    CARDS_HTML:        buildCardsHtml(clicks),
    CARD_AUDIO_MAP:    buildCardAudioMap(clicks),
    CARD_INIT_SCRIPT:  buildCardInitScript(clicks),
    TOTAL_CARDS:       String(clicks.length || 3),
    // content-split / closing body
    BODY_CONTENT_HTML: bodyContentHtml,
    // Tab-panel template
    TABS_HTML:         buildTabButtonsHtml(tabs),
    TAB_PANELS_HTML:   buildTabPanelsHtml(tabs),
    TAB_AUDIO_MAP:     buildTabAudioMap(tabs),
    TOTAL_TABS:        String(tabs.length || 3),
    // KC / FQ per-option tokens
    QUESTION_TEXT:        escHtml(slide['Question'] || ''),
    OPTION_A_TEXT:        escHtml(slide['Choice-1'] || ''),
    OPTION_B_TEXT:        escHtml(slide['Choice-2'] || ''),
    OPTION_C_TEXT:        escHtml(slide['Choice-3'] || ''),
    OPTION_D_TEXT:        escHtml(slide['Choice-4'] || ''),
    OPTION_A_CORRECT:     String(correctIdx === 0),
    OPTION_B_CORRECT:     String(correctIdx === 1),
    OPTION_C_CORRECT:     String(correctIdx === 2),
    OPTION_D_CORRECT:     String(correctIdx === 3),
    REVIEW_SLIDE_ID:      slide['Review-Slide'] || '',
    FQ_EYEBROW:           'Final Assessment',
    FQ_QUESTION_LABEL:    escHtml(slide['Slide-Title'] || 'Final Assessment'),
    FQ_QUESTION_NUMBER_LABEL: `Question ${fqNum}`,
    // Legacy — kept for backward compat
    CHOICES_HTML:    buildChoicesHtml(slide, templateId),
    CORRECT_ANSWER:  String(correctNum),
    REVIEW_SLIDE:    slide['Review-Slide'] || '',
    QUESTION_NUMBER: String(fqNum),
  };

  return tokens;
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function camelToWords(str) {
  // "CardOne" → "Card One" | "BatteryOverview" → "Battery Overview"
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Validate storyboard
  const sbPath = path.resolve(args.storyboard);
  if (!fs.existsSync(sbPath)) {
    console.error(`Error: storyboard not found — ${sbPath}`);
    console.error('Run: npm run import-storyboard -- --docx <file.docx>');
    process.exit(1);
  }

  console.log(`\nGenerating slides from: ${path.basename(sbPath)}`);
  console.log('─'.repeat(60));

  const { courseTitle, slides } = parseCourseMd(sbPath);
  console.log(`Course: ${courseTitle}  |  Slides: ${slides.length}\n`);

  // Ensure output directories exist
  fs.mkdirSync(path.resolve(args.slidesDir), { recursive: true });
  fs.mkdirSync(path.resolve(args.dataDir),   { recursive: true });

  let written = 0;
  let skipped = 0;
  let errors  = 0;

  // Collect KC review map and FQ question IDs while iterating
  const kcReviewMap = {};
  const fqQuestionIds = [];

  for (const slide of slides) {
    const slideId    = slide['Slide-ID'];
    const templateId = slide['Template-ID'];
    const outPath    = path.resolve(args.slidesDir, slideId + '.html');

    // Track KC review map
    if (/^KC[_-]/i.test(slideId) && slide['Review-Slide']) {
      kcReviewMap[slideId] = [slide['Review-Slide']];
    }

    // Track FQ question slides (not SCORE)
    if (/^FQ[_-]/i.test(slideId) && !/[_-]SCORE$/i.test(slideId)) {
      fqQuestionIds.push(slideId);
    }

    // Skip if exists and not forced
    if (!args.force && fs.existsSync(outPath)) {
      console.log(`  SKIP   ${slideId}.html  (exists — use --force to overwrite)`);
      skipped++;
      continue;
    }

    // Load template
    const templatePath = path.resolve(args.templatesDir, templateId + '.html');
    if (!fs.existsSync(templatePath)) {
      console.warn(`  WARN   ${slideId} — template not found: ${templateId}.html — using content-split`);
      const fallbackPath = path.resolve(args.templatesDir, 'content-split.html');
      if (!fs.existsSync(fallbackPath)) {
        console.error(`  ERROR  ${slideId} — fallback template also missing`);
        errors++;
        continue;
      }
    }

    let templateHtml;
    try {
      const tplFile = fs.existsSync(templatePath)
        ? templatePath
        : path.resolve(args.templatesDir, 'content-split.html');
      templateHtml = fs.readFileSync(tplFile, 'utf8');
    } catch (err) {
      console.error(`  ERROR  ${slideId} — could not read template: ${err.message}`);
      errors++;
      continue;
    }

    // Build tokens and render
    const tokens   = buildTokens(slide, slides, courseTitle, templateHtml);
    const rendered = renderTemplate(templateHtml, tokens);

    // Write slide file
    try {
      fs.writeFileSync(outPath, rendered, 'utf8');
      const tplLabel = templateId.padEnd(18);
      console.log(`  WRITE  ${tplLabel}  →  ${slideId}.html`);
      written++;
    } catch (err) {
      console.error(`  ERROR  ${slideId} — write failed: ${err.message}`);
      errors++;
    }
  }

  // ── Update course.data.json ───────────────────────────────────────────────

  const dataPath = path.resolve(args.dataDir, 'course.data.json');
  let existing   = { meta: {}, slides: [] };
  if (fs.existsSync(dataPath)) {
    try { existing = JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
    catch (_) {}
  }

  // Preserve meta; update module title if meta.title is placeholder
  if (!existing.meta) existing.meta = {};
  if (!existing.meta.title || existing.meta.title === 'Module Title Here') {
    existing.meta.title = courseTitle;
  }

  // Build slides array
  existing.slides = slides.map(slide => {
    const slideId = slide['Slide-ID'];
    const entry = {
      id:       slideId,
      title:    slide['Slide-Title'] || slideId,
      audio_vo: resolveAudioPaths(slideId).playerPath,
    };
    // Next-Cue overrides the default Click_Next transition sound.
    // Storyboard authors set this on the last content slide before the quiz:
    //   Next-Cue: Click_Start_Quiz
    // The value is a bare filename (no path) resolved from assets/audio/vo/.
    if (slide['Next-Cue']) {
      const cueFile = slide['Next-Cue'].trim().replace(/\.mp3$/i, '') + '.mp3';
      entry.audio_cue_next = 'assets/audio/vo/' + cueFile;
    }
    return entry;
  });

  // Build quiz section
  existing.quiz = {
    final_quiz: {
      passing_score: existing.quiz?.final_quiz?.passing_score ?? 80,
      questions: fqQuestionIds,
    }
  };

  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  console.log(`\n✓ course.data.json  (${slides.length} slides, ${fqQuestionIds.length} FQ questions)`);

  // ── Write kc-review.json ──────────────────────────────────────────────────

  const kcPath = path.resolve(args.dataDir, 'kc-review.json');
  fs.writeFileSync(kcPath, JSON.stringify(kcReviewMap, null, 2) + '\n', 'utf8');
  const kcCount = Object.keys(kcReviewMap).length;
  console.log(`✓ kc-review.json    (${kcCount} KC slide${kcCount !== 1 ? 's' : ''})`);

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n' + '─'.repeat(60));
  console.log(`Written: ${written}  |  Skipped: ${skipped}  |  Errors: ${errors}`);

  if (written > 0) {
    console.log('\nNext steps:');
    console.log('  1. Review generated slides in course/slides/');
    console.log('  2. Fill in placeholder content (card bodies, body copy, images)');
    console.log('  3. npm run start-player  →  http://localhost:8080');
  }

  if (errors > 0) process.exit(1);
}

main().catch(err => { console.error(err.message); process.exit(1); });
