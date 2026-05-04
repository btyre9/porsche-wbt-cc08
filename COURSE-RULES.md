# Course Authoring Rules

The complete rule set for this system. Applies to every module built on this pipeline. When in doubt about any decision — storyboard content, template selection, audio behavior, player UI — check this file first.

Detailed reference for individual topics:
- Template specs and examples → `TEMPLATE-REFERENCE.md`
- Storyboard format details → `storyboard/STORYBOARD-FORMAT-v1.md`
- Pipeline commands → `PIPELINE-REFERENCE.md`
- Player rule implementation details → `PLAYER-RULES.md`

---

## Part 1 — Storyboard Authoring

These rules govern how the source storyboard `.md` file is written before import. A well-written storyboard produces slides that are complete and reviewable after generation — no hand-editing of HTML required.

### S1 — One field per line, no exceptions
The parser reads line by line. Every `Key: Value` pair must be on its own line. Any field name buried on the same line as another field is silently lost — the slide renders without errors but is missing content.

```
# Wrong — Image-File is silently lost:
On-Screen-Text: Your customer thinks in outcomes. Image-File: split_brain_CC08.webp

# Correct:
On-Screen-Text: Your customer thinks in outcomes.
Image-File: split_brain_CC08.webp
```

### S2 — Always specify Template-ID explicitly
Never rely on parser inference. Always write the exact Template-ID from `TEMPLATE-REFERENCE.md`. Wrong inference generates the wrong HTML structure and requires a full rebuild.

### S3 — Include every required field for the chosen template
Every template in `TEMPLATE-REFERENCE.md` lists required fields. A slide block must include all of them. Missing required fields produce placeholder HTML or empty layout slots.

### S4 — Use canonical field names and explicit VO keys
Use exact field names from `TEMPLATE-REFERENCE.md`. Use explicit VO trigger keys — `Voiceover-INTRO`, `Voiceover-CLICK-Label`, `Voiceover-TAB-Label`, `Voiceover-STEP-NN`. Do not use the legacy `[After Card1]` marker format.

### S5 — Card content fields must follow every Voiceover-CLICK key
For `card-explore` slides, each `Voiceover-CLICK-Label` must be immediately followed by its three content fields on the next lines:

```
Voiceover-CLICK-Feature: The Feature is the component or part...
Card-Title-Feature: What You Found
Card-Sig-Feature: Feature
Card-Bullets-Feature: The component you're recommending | State it clearly | Example: "Your shock absorbers are leaking."
```

The Label in `Card-Title-Label`, `Card-Sig-Label`, and `Card-Bullets-Label` must exactly match (case-sensitive) the Label in the corresponding `Voiceover-CLICK-Label` key. A slide is incomplete if any card is missing its content fields. `Card-Image-Label` is optional — the generator cycles through available Porsche images as placeholders.

### S6 — Card order equals display order
The left-to-right card position on screen matches the top-to-bottom order of `Voiceover-CLICK-*` keys in the storyboard. Put the logical starting point first (e.g., Feature before Function before Benefit).

### S7 — Separate VO clips for every interaction
For any slide where clicking reveals new content, provide a separate `Voiceover-CLICK-*` or `Voiceover-TAB-*` key for each interaction. Do not rely on one long narration to cover all reveals.

### S8 — VO-Cue fields for learning-objectives slides
After VO is recorded and VTT caption files exist, run `npm run extract-vo-cues` to automatically write `VO-Cue-N` fields into `course.md`. These cue times drive the emphasis animation on each objective. Do not write them by hand.

---

## Part 2 — Slide IDs and Naming

### N1 — Canonical Slide ID format
```
SLD_CC08_001    ← content slide
KC_CC08_001     ← knowledge check
FQ_CC08_001     ← final quiz question
FQ_CC08_SCORE   ← quiz score
```
Use underscores, uppercase module code, three-digit sequence. Legacy dash-separated IDs are normalized by the parser but should not be used in new storyboards.

### N2 — Audio file naming (auto-generated)
Audio files are named by the generator — never name them by hand.
```
{SLIDE_ID}_INTRO.mp3           ← slide narration
{SLIDE_ID}_CLICK_{Label}.mp3   ← card-explore click audio
{SLIDE_ID}_TAB_{Label}.mp3     ← tab-panel tab audio
{SLIDE_ID}_STEP_{N}.mp3        ← step-sequence step audio
```
The Label must be PascalCase with no spaces: `BodyLanguage`, `Feature`, `FirstTime`.

---

## Part 3 — Pipeline

### PL1 — Edit workflow (after editing course.md)
Always run both commands in order after saving `course.md`:
```
npm run extract-vo-cues
npm run generate-slides -- --force
```
`extract-vo-cues` must run first to write VO cue times. `--force` is required — without it, existing slide files are skipped.

### PL2 — VO workflow (after changing Voiceover-INTRO text)
Only needed when the spoken narration changes:
```
npm run generate-vo
npm run generate-vtt
npm run extract-vo-cues
npm run generate-slides -- --force
```
Changing slide titles, bullets, image filenames, or card content only requires the two-command version (PL1).

### PL3 — New module workflow
```
npm run import-storyboard -- --md storyboard/YourStoryboard.md
npm run generate-slides
npm run generate-vo
npm run generate-vtt
npm run extract-vo-cues
npm run generate-slides -- --force
```

### PL4 — Hard refresh after regeneration
After regenerating slides, always hard-refresh the browser (Cmd+Shift+R) to clear cached slide files.

---

## Part 4 — Audio

### A1 — One audio clip at a time
Only one audio clip plays at any moment. The player maintains two channels — VO narration and interaction audio. Starting a new interaction clip automatically stops the previous one.

### A2 — Mute applies to all channels
The mute button silences both channels simultaneously. New interaction clips created while muted start muted.

### A3 — VO narration pauses during interaction clips
When a learner clicks a card, tab, or any interaction element, the VO narration pauses. It resumes automatically when the interaction clip ends. Send `pauseNarration: true, resumeNarration: true` with every `sandbox-play-interaction` message.

**Exception:** Tab-panel uses `resumeNarration: false` because the INTRO narration has already ended by the time tabs unlock.

### A4 — All audio routed through the player bridge
Templates must never create `new Audio()` objects directly. All audio must go through:
- `window.parent.postMessage({ type: 'sandbox-play-interaction', src, id, pauseNarration, resumeNarration }, '*')`
- or `window.parent.CourseRuntime.playInteractionAudio({ src })`

The only exception is `modal-audio-progress`, which has a documented mirror-audio use case.

---

## Part 5 — Progress Bar

### P1 — Thin clip-progress bar at the bottom edge of the top bar
The progress bar is a 3px red line spanning the full width of the top bar, flush at its bottom edge. It tracks whichever audio clip is currently playing.

- Resets to zero instantly (no back-animation) when a new interaction clip starts.
- Resets to zero when a new slide loads.
- Continues from the VO's current position when the VO resumes after an interaction clip ends.
- No time counter is displayed. The bar is visual only.

---

## Part 6 — Interaction Locks

### I1 — INTRO lock: all interactions disabled while INTRO plays
**This rule applies to every template that has any clickable element — including knowledge-check, final-quiz, and all interactive content slides.** No exceptions.

Cards, tabs, option rows, drag items, hotspot markers, and all clickable interaction elements are disabled while the slide's INTRO audio is playing. The player drops `sandbox-play-interaction` messages while `state.nextLockedByAudio` is true.

Templates must start interaction elements in a locked state (CSS `pointer-events: none`, optionally `filter: brightness(0.5)` for visual feedback) and unlock only when the `player-intro-state: { locked: false }` message arrives from the player. Always include a standalone fallback to unlock immediately when no player is present.

**Templates confirmed compliant as of this module:**
- `card-explore` — tile row locked
- `tab-panel` — tabs-nav locked
- `drag-match` — items and targets locked
- `hotspot` — marker container locked
- `tile-explore` — tile row locked
- `knowledge-check` — options list locked
- `final-quiz` — options list locked

### I2 — Next button locked during INTRO VO
The Next button is disabled for the duration of INTRO audio playback.

### I3 — Next button locked until all interactions complete
On interactive slides, Next stays locked until the learner has visited every required interaction element. Required IDs are declared via `sandbox-configure-interactions`.

### I4 — 2-second pause before Click_Next.mp3 plays
When the last required interaction is visited, the Next button enables immediately. `Click_Next.mp3` plays 2 seconds later. This gives the learner a brief breath after the last interaction audio ends before the navigation prompt sounds. The delay is implemented centrally in `runtime.js → maybePlayFinalNextCue()` and applies to all interactive templates automatically.

### I5 — Next button pulses on unlock
When Next transitions from disabled to enabled, it plays a brief red-ring pulse animation to draw attention.

### I6 — Player controls always active
These four controls are never disabled by any lock state — not during INTRO, not while interactions are incomplete:
- **Mute / Volume**
- **Captions**
- **Refresh / Replay**
- **Speed**

---

## Part 7 — Building New Templates

Every new interactive template must satisfy all four of these before it ships:

### T1 — Route all audio through the player bridge (Rule A4)
No `new Audio()`. Use `postMessage` or `CourseRuntime`.

### T2 — Implement the INTRO lock pattern
```js
var interactionsLocked = true;
var container = document.getElementById('your-container-id');
if (container) container.style.pointerEvents = 'none';

function unlockInteractions() {
  if (!interactionsLocked) return;
  interactionsLocked = false;
  if (container) container.style.pointerEvents = '';
}

// Wait for player-intro-state; if none arrives within 300ms assume standalone mode.
// Do NOT use the synchronous window.parent.CourseRuntime check — it fires before the
// player has time to initialize and causes interactions to unlock during INTRO.
var _introMsgReceived = false;
window.addEventListener('message', function (e) {
  if (!e.data || e.data.type !== 'player-intro-state') return;
  _introMsgReceived = true;
  if (!e.data.locked) unlockInteractions();
});
setTimeout(function () { if (!_introMsgReceived) unlockInteractions(); }, 300);
```

### T3 — Click handlers guard against locked state
```js
element.addEventListener('click', function () {
  if (interactionsLocked) return;
  // handle click
});
```

### T4 — Declare required IDs via sandbox-configure-interactions on DOMContentLoaded
```js
window.parent.postMessage({
  type: 'sandbox-configure-interactions',
  requiredIds: ['CardA', 'CardB', 'CardC'],
  finalCueSrc: 'assets/audio/vo/Click_Next.mp3',
  lockNextUntilComplete: true
}, '*');
```

---

## Part 8 — Content Quality Standard

A generated slide is complete when a reviewer can open it in a browser and see finished, accurate content without any placeholder text, empty layout slots, or missing audio references. If a slide requires hand-editing the HTML after generation, the storyboard was incomplete.

Apply this test after every generation run:
1. Open each slide in `npm run start-player`.
2. Verify all text is real content, not `<!-- Add bullet content here -->` or similar.
3. Verify all images either load or are clearly marked as not-yet-sourced with an art direction note.
4. Verify INTRO audio plays on slide load.
5. On interactive slides: confirm interactions are locked during INTRO, unlock after, Next locks until all are visited, Next pulses on unlock.

---

## Part 9 — New Module Checklist

Use this checklist when starting from scratch on a new module.

**Storyboard**
- [ ] Every slide has `Slide-ID`, `Template-ID`, `Slide-Title`
- [ ] Every `Template-ID` matches an entry in `TEMPLATE-REFERENCE.md`
- [ ] Every required field for each template is present
- [ ] All fields are one per line
- [ ] `card-explore` slides: every `Voiceover-CLICK-Label` has matching `Card-Title`, `Card-Sig`, `Card-Bullets` fields
- [ ] Card order reflects the logical left-to-right sequence
- [ ] Audio VO trigger keys are explicit (`Voiceover-CLICK-Label`, not legacy markers)

**Generation**
- [ ] `npm run import-storyboard` completes without errors
- [ ] `npm run generate-slides` produces all expected HTML files
- [ ] `npm run generate-vo` generates all MP3 files
- [ ] `npm run generate-vtt` generates all VTT caption files
- [ ] `npm run extract-vo-cues` writes `VO-Cue-N` fields for all `learning-objectives` slides
- [ ] `npm run generate-slides -- --force` regenerates with cue times written in

**Review**
- [ ] Every slide shows finished content (no placeholders)
- [ ] INTRO audio plays on each slide load
- [ ] Interaction elements locked during INTRO on **every** interactive slide — cards, tabs, tiles, drag items, hotspots, KC options, FQ options
- [ ] Next locks during INTRO and while interactions are incomplete
- [ ] Next unlocks and pulses simultaneously with `Click_Next.mp3`
- [ ] Mute button silences all audio including interaction clips
- [ ] Progress bar is thin red line at bottom of top bar, resets on each new clip
- [ ] Captions, mute, replay, speed all work at all times

**Delivery**
- [ ] `npm run package` produces a valid SCORM zip in `output/`
- [ ] SCORM zip tested in target LMS before delivery
