# Player Rules

> The canonical rule set is in **`COURSE-RULES.md`**. This file documents the implementation details behind each rule.

Rules enforced across all modules. These apply to `runtime.js`, all slide templates, and any new templates built in the future. When building a new module or template, verify all rules below are satisfied before delivery.

---

## Audio rules

### Rule A1 — One audio clip at a time
Only one audio clip may be playing at any moment. The player maintains two channels:
- **VO narration** (`state.audio`) — the INTRO audio for the current slide
- **Interaction audio** (`state.interactionAudio`) — click/tab/interaction clips

Starting a new interaction clip automatically stops the previous one. The VO narration pauses when an interaction clip starts and resumes when it ends.

**Implementation:** `playInteractionAudio()` in `runtime.js` calls `stopInteractionAudio()` before creating a new channel.

**Template requirement:** All audio must be played through the player bridge — either via `window.parent.postMessage({ type: 'sandbox-play-interaction', ... }, '*')` or `window.parent.CourseRuntime.playInteractionAudio({ src })`. Templates must never create standalone `new Audio()` objects.

---

### Rule A2 — Mute applies to all audio channels
The mute button silences both the VO narration channel and any currently-playing interaction audio channel. New interaction clips created while muted start muted.

**Implementation:** `toggleMute()` sets `.muted` on both `state.audio` and `state.interactionAudio`. `playInteractionAudio()` sets `channel.muted = state.muted` immediately on creation.

---

### Rule A3 — VO pauses during interaction clips
When a card, tab, or other interaction element is clicked and plays audio, the VO narration pauses. It resumes automatically when the interaction clip finishes.

**Implementation:** Send `pauseNarration: true, resumeNarration: true` with every `sandbox-play-interaction` message. This is already the default — `opts.pauseNarration !== false` defaults to `true`.

**Exception:** Tab-panel uses `resumeNarration: false` intentionally because the VO narration for that slide has already ended by the time tabs are unlocked.

---

## Progress bar

### Rule P1 — Progress bar tracks the active clip, resets on every new clip
The thin red progress bar lives at the bottom edge of the top bar (not in the control bar). It shows the playback position of whichever audio clip is currently playing — either the VO narration or an interaction clip.

- When the learner clicks something that starts a new interaction clip, the bar **instantly resets to 0** (no back-animation) and tracks the new clip.
- When a new slide loads, the bar resets to 0 and tracks the new INTRO VO.
- When an interaction clip ends and the VO narration resumes, the bar continues from the VO's current position.
- There is no time counter. The bar is visual-only.

**Implementation:** `resetProgressBar()` in `runtime.js` is called at the start of `playInteractionAudio()` and on every slide change. The interaction audio channel has a `timeupdate` listener that calls `syncAudioProgress()`. `syncAudioProgress()` reads from `state.interactionAudio` if it is playing, otherwise from `state.audio`.

---

## Interaction lock rules

### Rule I1 — INTRO lock: all interactions disabled during INTRO VO
While the slide's INTRO audio is playing, all clickable interaction elements (cards, tabs, buttons) are disabled. The player enforces this by dropping `sandbox-play-interaction` messages while `state.nextLockedByAudio` is true.

**Template requirement:** Interactive elements must start in a locked state (CSS `pointer-events: none`, visually dimmed). They unlock when the slide receives `{ type: 'player-intro-state', locked: false }` from the player. Always include a standalone fallback: `try { if (!window.parent.CourseRuntime) unlock(); } catch (_) { unlock(); }`.

**Player controls that remain active during INTRO lock:** mute, captions, refresh, speed. These are always enabled regardless of lock state.

---

### Rule I2 — Next button locked during INTRO VO
The Next button is disabled while `state.nextLockedByAudio` is true (INTRO is playing).

**Implementation:** `updateNavButtons()` in `runtime.js` sets `btn-next.disabled = atEnd || locked`.

---

### Rule I3 — Next button locked until all interactions complete
On interactive slides (card-explore, tab-panel, tile-explore), the Next button stays locked until the learner has visited every required interaction element. Required IDs are declared via `sandbox-configure-interactions`.

**Implementation:** `state.nextLockedByInteraction` is controlled by `configureInteractionFlow()` and `markInteractionVisited()`.

---

### Rule I4 — Click_Next.mp3 fires simultaneously with Next unlock
When the last required interaction is visited, Click_Next.mp3 plays and the Next button unlocks at the same moment. The learner can advance immediately or wait for the clip to finish.

**Implementation:** `maybePlayFinalNextCue()` calls `updateInteractionNextLock()` (which clears `nextLockedByInteraction`) before calling `playInteractionAudio()`, so the unlock and the audio start in the same call stack.

---

### Rule I5 — Next button pulses on unlock
When the Next button transitions from disabled to enabled, it plays a short red-ring pulse animation to draw the learner's attention.

**Implementation:** `updateNavButtons()` adds the `pulse-unlock` CSS class on the `false → true` transition. CSS keyframe `pulse-unlock` is defined in `player/index.html`.

---

## Template authoring rules

### Rule T1 — All audio routed through the player bridge
Templates must never create `new Audio()` directly. All audio must go through:
- `window.parent.postMessage({ type: 'sandbox-play-interaction', src, id, pauseNarration, resumeNarration }, '*')` — preferred for template scripts
- `window.parent.CourseRuntime.playInteractionAudio({ src })` — for CourseRuntime API usage

**Exception:** The `modal-audio-progress` template manages a mirror audio element for a specific sync use case — this is documented within that template and must not be extended.

---

### Rule T2 — INTRO lock pattern (required for all interactive templates)
Every template with clickable interaction elements must implement this pattern:

```js
/* Lock interactions during INTRO */
var interactionsLocked = true;
var container = document.getElementById('your-container-id');
if (container) container.style.pointerEvents = 'none';

function unlockInteractions() {
  if (!interactionsLocked) return;
  interactionsLocked = false;
  if (container) container.style.pointerEvents = '';
  // ... activate first element if needed
}

window.addEventListener('message', function (e) {
  if (!e.data) return;
  if (e.data.type === 'player-intro-state' && !e.data.locked) unlockInteractions();
});

/* Standalone / no-player fallback */
try { if (!window.parent || !window.parent.CourseRuntime) unlockInteractions(); } catch (_) { unlockInteractions(); }
```

---

### Rule T3 — Interaction click handlers check lock state
Click and keydown handlers must check whether interactions are locked before acting. Even though the player drops messages during INTRO, the in-slide guard prevents stale events from queued interactions.

```js
element.addEventListener('click', function () {
  if (interactionsLocked) return;
  // ... handle click
});
```

---

### Rule T4 — sandbox-configure-interactions on DOMContentLoaded
Every interactive template must declare its required IDs synchronously on DOMContentLoaded via `sandbox-configure-interactions` so the player locks Next before INTRO ends.

```js
window.parent.postMessage({
  type: 'sandbox-configure-interactions',
  requiredIds: ['CardA', 'CardB', 'CardC'],
  finalCueSrc: 'assets/audio/vo/Click_Next.mp3',
  lockNextUntilComplete: true
}, '*');
```

---

## Player controls always active

These controls are never disabled by any lock state:
- **Mute / Volume** button
- **Captions** toggle
- **Refresh / Replay** button
- **Speed** cycle button

---

## Applying these rules to a new module

When building a new module from scratch:

1. Use only templates listed in `TEMPLATE-REFERENCE.md` — they already implement Rules T1–T4.
2. If adding a new template, implement the INTRO lock pattern (Rule T2) and the bridge pattern (Rule T1) before anything else.
3. The generator (`generate-slides.js`) and `runtime.js` enforce Rules A1–A3 and I1–I5 automatically — no per-module work needed.
4. Test by loading a card-explore or tab-panel slide, clicking a card before INTRO ends (nothing should happen), then clicking after INTRO ends (audio should play, Next should lock). When all cards are visited, Next should unlock with a pulse and Click_Next.mp3 should play.
