# Porsche WBT Slide Template Reference

**How to use:**
Give this document to Claude alongside `STORYBOARD-AUTHOR-PROMPT.md` and the course learning materials. Claude selects the best template for each slide, writes all required fields, and outputs a complete, parser-ready storyboard. Every example in this document can be used as a direct model.

**Two template types:**
- **Standard** — fully implemented in `generate-slides.js`. Storyboard fields populate the HTML automatically via the pipeline.
- **Emerging** — custom-built HTML based on a CC03 reference implementation. Write the storyboard block the same way; HTML is built by hand and customized with the slide's content. These will be promoted to Standard as the template library grows.

---

## Images on Every Slide

Every slide should carry an image wherever the template supports one. Never leave a slide imageless if there is a layout slot for it.

**Two image fields — always use both when possible:**

| Field | Purpose | When to use |
|-------|---------|-------------|
| `Image` | Art direction | Always include. Describe the ideal image: subject, mood, composition, setting. This is what the asset team uses to source or generate the image. |
| `Image-File` | Production filename | Add once the asset is ready: `technician_greeting_CC03.webp`. Follows the `descriptive_name_CCxx.webp` convention. |

**Placeholder rule:** When `Image-File` is not yet provided, the HTML must render an `.img-placeholder` element — a styled dark-striped block occupying the image slot — so the slide layout is complete and no area is left visually empty. Every template HTML file should include this element by default, swapped out for the real `<img>` once the asset arrives.

**`quiz-score`, `knowledge-check`, and `final-quiz`** are the only templates where no image slot exists in the current HTML. All other templates require an image.

---

## Template Overview

| Template ID | Type | Purpose |
|-------------|------|---------|
| `hero-title` | Standard | Module opener — full-bleed hero image with title |
| `objectives` | Standard | Learning objectives — animated numbered list |
| `content-split` | Standard | Core instructional content — text + image |
| `content-stat` | Standard | Single statistic highlight |
| `content-bullets` | Standard | Principles or steps list with image |
| `content-quote` | Standard | Atmospheric leadership or brand quote |
| `card-explore` | Standard | 3–6 parallel concepts — clickable cards |
| `knowledge-check` | Standard | Mid-module comprehension check |
| `final-quiz` | Standard | End-of-module scored question |
| `quiz-score` | Standard | Final results display — SCORM reporting |
| `closing` | Standard | Module wrap-up before assessment |
| `tile-explore` | Emerging | 3–5 expanding tiles with poster images |
| `tab-panel` | Emerging | Tabbed content — 3–5 tabs each with VO |
| `step-sequence` | Emerging | Sequential steps — VO-driven, all required |
| `video-scenario` | Emerging | Video player with optional pause-point quiz |
| `bar-chart-modal` | Emerging | Animated bar chart with clickable modal detail |
| `drag-match` | Emerging | Active matching — drag items to correct targets |
| `hotspot` | Emerging | Clickable markers on a background image |

---

## Standard Templates

---

### `hero-title`

**Status:** Standard — parser-generated
**Use when:** Opening every module. Always Slide 01. No exceptions.
**Avoid when:** Any position other than Slide 01.

**What the learner sees:**
Full-bleed background image with dark gradient overlay. Left-aligned: small module eyebrow label, red accent bar (120px × 8px), large module title, subtitle line below. Title fades in at 0.5s. Optional Lottie underline animation on the title.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Module title text | Main hero heading |
| `Image-File` | `descriptive_name_CCxx.webp` | Full-bleed background — premium, aspirational |
| `Hero-Subtitle` | e.g. `Module 3 of 12` | Caption line below the title |
| `Voiceover-INTRO` | 3–5 sentences | Welcome + module purpose + what learner will gain |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Image` | Art direction if `Image-File` is not yet sourced |

**Interaction model:**
- Next unlocks on slide load — no interaction lock.
- VO plays on entry. No other interactions.

**VO guidance:**
Open with the module name and number. State what the learner will gain. End with energy — this sets the tone for the entire module. Do not list objectives here (that is the next slide's job).

**Example:**
```
## Slide 01 — Module Title

Slide-ID: SLD_CC00_001
Template-ID: hero-title
Slide-Title: The Art of Communication
Image-File: porsche_advisor_greeting_CC00.webp
Hero-Subtitle: Module 3 of 12
>> On slide load → SLD_CC00_001_INTRO.mp3
Voiceover-INTRO: Welcome to Module 3 — The Art of Communication. In every service interaction, the words you choose, the way you listen, and the energy you bring determine whether a customer leaves satisfied — or simply leaves. In this module, you'll learn the communication skills that set Porsche service professionals apart from the rest.
Caption-Text: Welcome to Module 3 — The Art of Communication.
Image: Wide shot of a Porsche service advisor engaged in warm conversation with a customer at a service desk. Professional, attentive, premium environment. Porsche branding visible in background.
Status: Draft
Notes: hero-title chosen — standard module opener. Hero image should reinforce the communication theme.
```

---

### `objectives`

**Status:** Standard — parser-generated
**Use when:** Slide 02 of every module. Always second. No exceptions.
**Avoid when:** Any position other than Slide 02.

**What the learner sees:**
Two-column layout: section heading on the left, numbered learning objectives on the right that animate in sequentially. All objectives must be visible before Next unlocks.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | e.g. `In this module, you will:` | Left column heading |
| `Objective-1` through `Objective-N` | Verb-first: `Identify…`, `Explain…`, `Apply…` | **Required.** One complete objective per field. Parser stops at first missing number. Max 10. If no `Objective-N` fields exist, the generator outputs placeholder comments — treat this as a build error and fix the storyboard before publishing. |
| `Voiceover-INTRO` | 1 intro + 1 sentence per objective | VO names each objective aloud so animation timing aligns |
| `Caption-Text` | ≤120 chars | e.g. `By the end of this module, you will be able to do four things.` |
| `Image-File` | `descriptive_name_CCxx.webp` | Right-side contextual image — a scene that represents the module's subject matter |
| `Image` | Art direction | Include if `Image-File` is not yet sourced. Renders as `.img-placeholder` until asset is ready. |

**Optional fields (post-production):**

| Field | Notes |
|-------|-------|
| `VO-Cue-1` through `VO-Cue-N` | Fill in after VO is recorded. Time in seconds from the start of the INTRO audio at which that objective should receive the emphasis animation. One field per objective — `VO-Cue-1: 4.2`, `VO-Cue-2: 8.7`, etc. The generator writes these into the slide's `voTimes` JS array. Leave absent (or set to `null`) until the recording is available. |

**Interaction model:**
- Next locks on entry until all objectives have animated in.
- Objectives animate in sequentially via GSAP stagger on load (scale 0.88 → 1, opacity 0 → 1).
- **Emphasis rule:** When the VO reaches the cue time for each objective, that objective receives an emphasis animation (scale 1.06×, brightness 1.35×). All objectives not yet reached are dimmed (brightness 0.5×). This is driven by the `VO-Cue-N` fields written into the slide's `voTimes` JS array. Every published slide must have `VO-Cue-N` values set — `null` entries are only acceptable before VO recording is complete.
- No click interaction required.

**VO guidance:**
One sentence stating the total count ("By the end of this module, you will be able to do four things."), then one sentence per objective. Each objective sentence should closely echo the `Objective-N` field text so the animation timing aligns naturally.

**Example:**
```
## Slide 02 — Learning Objectives

Slide-ID: SLD_CC00_002
Template-ID: objectives
Slide-Title: What You'll Learn
Caption-Text: By the end of this module, you will be able to do four things.
On-Screen-Text: By the end of this module, you will be able to do four things.
Objective-1: Explain why communication breaks down in service interactions
Objective-2: Identify the four active listening techniques used by top advisors
Objective-3: Apply the FACE framework to your next customer conversation
Objective-4: Recognize common barriers to listening and how to overcome them
Image-File: learning_objectives_CC00.webp
Image: A Porsche service advisor in a clean, professional environment. Attentive and approachable.
Voiceover-INTRO: By the end of this module, you will be able to do four things. First — explain why communication breaks down even when both parties are trying. Second — identify the four active listening techniques used by the most effective Porsche service advisors. Third — apply the FACE framework in your next customer conversation. And fourth — recognize the most common barriers to listening and know what to do about them.
Status: Draft
Notes: objectives chosen — standard second slide. VO explicitly names each objective so stagger animations sync naturally to audio.
```

---

### `content-split`

**Status:** Standard — parser-generated
**Use when:** Presenting a single instructional concept — one main idea with supporting context. Most common content slide type.
**Avoid when:** Content is a list (use `content-bullets`), a key statistic (use `content-stat`), needs interaction (use `card-explore` or `tile-explore`), or is a leadership quote (use `content-quote`).

**What the learner sees:**
Two-column layout: text on the left (heading, red accent bar, body paragraph OR a Pull-Quote), image on the right. Entrance animations stagger left to right on load.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | Displayed above body copy |
| `On-Screen-Text` | 1–3 sentence paragraph | Body copy. Do not combine with `Pull-Quote`. |
| `Image-File` | `descriptive_name_CCxx.webp` | Right-column image |
| `Voiceover-INTRO` | 4–7 sentences | Expand on the on-screen content — never repeat it verbatim |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Pull-Quote` | Replaces `On-Screen-Text` with a large styled key-point statement. One sentence. Use when the slide carries a single defining idea that should land visually. **Never use both** `Pull-Quote` and `On-Screen-Text` — if both are present, `Pull-Quote` takes priority. |
| `Image` | Art direction if `Image-File` is not yet sourced |

**Interaction model:**
- No interaction locks. Content animates in on load. Next available immediately.

**VO guidance:**
4–7 sentences. Open by contextualizing the on-screen text, then expand with supporting detail, examples, or implications. End with a bridge sentence toward the next slide. Do not read the on-screen text verbatim.

**Example — body copy:**
```
## Slide 04 — Why Communication Fails

Slide-ID: SLD_CC00_004
Template-ID: content-split
Slide-Title: Why Communication Fails
On-Screen-Text: Communication breaks down not because people aren't trying — but because most conversations are built on assumptions about what the other person already understands.
Image-File: crossed_signals_CC00.webp
>> On slide load → SLD_CC00_004_INTRO.mp3
Voiceover-INTRO: Here's the paradox of communication failures — they almost never happen because people stop trying. They happen because both parties assume they're already aligned. In a service context, you might assume the customer knows what a specific repair involves. They assume you know exactly what they mean by "it feels off." Those assumptions stack, and suddenly a simple service appointment becomes a complaint. Closing that gap is what this module is about.
Caption-Text: Communication breaks down not because people aren't trying.
Image: Stylized concept image — two people in conversation, each looking in slightly different directions. Minimal, premium design aesthetic.
Status: Draft
Notes: content-split chosen — single concept, body copy carries the full idea.
```

**Example — Pull-Quote:**
```
## Slide 05 — The First Impression Window

Slide-ID: SLD_CC00_005
Template-ID: content-split
Slide-Title: The First Impression Window
Pull-Quote: You have about seven seconds to establish trust — after that, the customer has already decided how they feel about you.
Image-File: advisor_greeting_CC00.webp
>> On slide load → SLD_CC00_005_INTRO.mp3
Voiceover-INTRO: Research on first impressions consistently points to a seven-second window. In those seven seconds, a customer has already formed a judgment about whether you're trustworthy, whether you listen, and whether they'll be comfortable with you managing their vehicle. You can recover from a weak first impression — but it takes the rest of the appointment to do it. Getting it right from the start is always worth the effort.
Caption-Text: You have about seven seconds to establish trust.
Image: Porsche service advisor greeting a customer at the service bay entrance. Confident, warm expression. Good posture. Premium service environment.
Status: Draft
Notes: content-split with Pull-Quote chosen — single defining insight. Quote makes it land visually; VO carries the supporting reasoning.
```

---

### `content-stat`

**Status:** Standard — parser-generated
**Use when:** A single number, percentage, or ratio is the central point of the slide.
**Avoid when:** You have multiple statistics (use `content-split` with body copy) or the stat needs interactive exploration.

**What the learner sees:**
Split layout: intro paragraph on the left, large highlighted statistic on the right (value displayed large, label displayed beneath). Dramatic visual weight on the number.

**`On-Screen-Text` format — `VALUE Label`:**
Parser splits on the first space. Everything before the first space becomes the large stat value; everything after becomes the label below it.
- `94% Customer Satisfaction Score`
- `7 Seconds to Make a First Impression`
- `3× More Likely to Return`

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | |
| `On-Screen-Text` | `VALUE Label` | First token = large stat; remainder = label |
| `Image-File` | `descriptive_name_CCxx.webp` | Supporting image — reinforces the context of the statistic |
| `Voiceover-INTRO` | 4–6 sentences | State the number, then contextualize — what it means, why it matters in practice |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Image` | Art direction if `Image-File` is not yet sourced. Renders as `.img-placeholder` until asset is ready. |

**Interaction model:**
- No interaction locks. Stat animates in on load.

**VO guidance:**
State the number first. Spend 3–4 sentences on what it means in daily practice. Don't just restate the label — connect it to behavior.

**Example:**
```
## Slide 06 — What the Data Says

Slide-ID: SLD_CC00_006
Template-ID: content-stat
Slide-Title: What the Data Says
On-Screen-Text: 55% of Communication Is Nonverbal
>> On slide load → SLD_CC00_006_INTRO.mp3
Voiceover-INTRO: Fifty-five percent. That's the share of your message carried by body language alone — before a single word is considered. Add tone of voice, and you're at over ninety percent before the content of what you say even registers. This matters because it means the most important parts of your communication happen before you open your mouth. Your posture when you approach, your eye contact when you listen, your expression when you deliver news — all of it speaks louder than the words.
Caption-Text: Fifty-five percent of communication is carried by body language alone.
Status: Draft
Notes: content-stat chosen — the 55% figure anchors the nonverbal communication section. Stat value: 55%, label: "of Communication Is Nonverbal".
```

---

### `content-bullets`

**Status:** Standard — parser-generated
**Use when:** Presenting a list of 3–6 parallel items — principles, considerations, or components where order doesn't matter.
**Avoid when:** Items have a required sequence (use `step-sequence`), items need individual deep-dive interaction (use `card-explore`), or there are more than 6 items.

**What the learner sees:**
Split layout: brief intro paragraph above a bulleted list on the left, image on the right. The generator creates HTML scaffold with `<!-- Bullet heading -->` and `<!-- Supporting detail -->` placeholder comments — these must be filled in manually after running the generator.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | |
| `On-Screen-Text` | 1–2 sentence intro | Sets up the list |
| `Bullet-1` through `Bullet-N` | One bullet per field | 3–6 bullets. Parser reads consecutive Bullet-N fields until a number is missing. Write each bullet as a complete short phrase — no leading dash or asterisk. |
| `Image-File` | `descriptive_name_CCxx.webp` | Right-column image |
| `Voiceover-INTRO` | 4–7 sentences | Walk through each bullet with one sentence each |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**VO guidance:**
One intro sentence, then one sentence per bullet. Keep each bullet explanation tight — one clear idea per item.

**Example:**
```
## Slide 08 — The FACE Framework

Slide-ID: SLD_CC00_008
Template-ID: content-bullets
Slide-Title: The FACE Framework
On-Screen-Text: Top Porsche service advisors structure every intake conversation using four steps.
Image-File: face_framework_overview_CC00.webp
Bullet-1: Focus — begin every intake with your full, undivided attention on the customer
Bullet-2: Acknowledge — confirm what the customer said before moving forward
Bullet-3: Clarify — ask the one follow-up question that fills in the biggest gap
Bullet-4: Explore — look beyond the reported concern for anything else that needs attention
Voiceover-INTRO: The FACE framework gives every intake conversation a reliable structure. Focus — start the interaction with your full, undivided attention on the customer. Acknowledge — confirm what they've told you before moving forward. Clarify — ask the one follow-up question that fills in the biggest gap. And Explore — look beyond the reported concern to anything else that may need attention. Use these four steps in sequence, and you'll rarely leave a customer feeling unheard.
Caption-Text: Top Porsche service advisors structure every intake using four steps.
Image: Clean graphic or illustration of the four FACE steps — minimal, branded, on dark background.
Status: Draft
Notes: content-bullets chosen — four parallel framework components. Bullet-1 through Bullet-4 are parsed directly into the HTML list.
```

---

### `content-quote`

**Status:** Standard — parser-generated
**Use when:** Delivering a brand philosophy statement, leadership quote, or memorable customer insight. Use to create an emotional beat between instructional sections.
**Avoid when:** The content is instructional rather than inspirational, or the slide needs to present multiple ideas.

**What the learner sees:**
Full-bleed atmospheric image as background. Large quote text on the left with a red accent bar, attribution name, and role beneath. Dark gradient overlay ensures text legibility over the image.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Quote` | The quoted text | Keep ≤25 words for visual impact |
| `Quote-Attribution` | Speaker name | First and last name |
| `Quote-Title` | Role or context | e.g. `Director of Customer Experience, Porsche Cars North America` |
| `Image-File` | `descriptive_name_CCxx.webp` | Full-bleed background — cinematic, atmospheric |
| `Voiceover-INTRO` | 4–6 sentences | Read the quote first, then contextualize it |
| `Caption-Text` | ≤120 chars | The quote text itself (first sentence) |

**Interaction model:**
- No interaction locks. Content appears on load.

**VO guidance:**
Open by reading the quote naturally (with quotation marks in delivery). Then spend 3–4 sentences on what it means for the learner's specific daily work. Make it personal and concrete.

**Example:**
```
## Slide 09 — Brand Principle

Slide-ID: SLD_CC00_009
Template-ID: content-quote
Quote: The customer doesn't remember what you fixed — they remember how you made them feel.
Quote-Attribution: Tara Reyes
Quote-Title: Director of Customer Experience, Porsche Cars North America
Image-File: porsche_mountain_road_CC00.webp
>> On slide load → SLD_CC00_009_INTRO.mp3
Voiceover-INTRO: "The customer doesn't remember what you fixed — they remember how you made them feel." This insight captures something essential about the Porsche service experience. The technical work is the baseline — it's expected. What separates great Porsche advisors is the human layer on top of it. The tone of voice, the follow-up call, the way you delivered difficult news — that's what the customer carries with them.
Caption-Text: The customer doesn't remember what you fixed — they remember how you made them feel.
Image: Dramatic wide shot of a Porsche 911 on an empty mountain road at dusk. Cinematic, golden hour light. Minimal — no people. Sense of journey.
Status: Draft
Notes: content-quote chosen — brand philosophy statement. Creates an emotional beat between technical content sections.
```

---

### `card-explore`

**Status:** Standard — parser-generated
**Use when:** Presenting 3–6 parallel concepts of roughly equal weight where active individual exploration is the goal.
**Avoid when:** Content is sequential (use `step-sequence`), items have poster images (use `tile-explore`), or there are more than 6 items.

**What the learner sees:**
Section heading above a grid of 3–6 cards. Cards are locked (grayed out with a shimmer) on entry. After the INTRO VO ends, cards unlock. Clicking a card plays its VO. Next button locks until all cards have been visited.

**Card label format:** PascalCase, no spaces — `ServiceQuality`, `ActiveListening`, `BodyLanguage`

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | |
| `On-Screen-Text` | 1–2 sentences | Instruction shown below the title, e.g. "Click each card to explore." |
| `Voiceover-INTRO` | 2–3 sentences | Name the topic; state the number of cards; end with instruction to click each one |
| `Voiceover-CLICK-Label` | One per card, 2–4 sentences each | Label becomes the PascalCase ID for the card. Plays on card click. Order determines left-to-right card position. |
| `Card-Title-Label` | Short phrase | Heading displayed on the card tile. One per card. Label matches the `Voiceover-CLICK-Label` key. |
| `Card-Sig-Label` | 1–3 words | Signature word shown with the card number mark (e.g., "01 · Feature"). Usually the plain-English label. |
| `Card-Bullets-Label` | Pipe-separated list | 2–4 bullet points for the card body. One per card. Separate items with ` | `. |
| `Card-Image-Label` | `filename.webp` | Poster image for the card tile. Optional — falls back to a rotating placeholder from available assets. |
| `Image-File` | `descriptive_name_CCxx.webp` | Background image behind the card grid |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

> **Rule:** Every `Voiceover-CLICK-Label` key requires a matching `Card-Title-Label`, `Card-Sig-Label`, and `Card-Bullets-Label` field. Missing content fields produce placeholder text. A slide should be considered incomplete if any of these are absent.

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Card-Image-Label` | Poster image per card. If omitted, the generator cycles through available Porsche images as placeholders. |
| `Image` | Art direction if `Image-File` is not yet sourced. Renders as `.img-placeholder` until asset is ready. |

**Audio file naming (auto-generated):** `{SLIDE_ID}_CLICK_{Label}.mp3`

**Interaction model:**
- Cards locked until INTRO VO ends.
- Card click → card content reveals + CLICK audio plays.
- Next locked until all cards visited.

**VO guidance:**
- INTRO (2–3 sentences): Name the topic and card count. End with a clear instruction to click each card.
- CLICK per card (2–4 sentences): Cover that concept directly and specifically. Don't introduce new concepts here.

**Example:**
```
## Slide 11 — The Three Channels of Communication

Slide-ID: SLD_CC00_011
Template-ID: card-explore
Slide-Title: The Three Channels of Communication
On-Screen-Text: Every message you send travels through three channels at once. Click each card to explore them.
Caption-Text: Every message you send travels through three channels simultaneously.
Image-File: communication_channels_CC00.webp
Voiceover-INTRO: Every message you send travels through three channels simultaneously. Understanding each one gives you more control over how you're perceived. Click each card to explore the three channels.
Voiceover-CLICK-BodyLanguage: Body language carries more of your message than most people realize — posture, eye contact, facial expression, and proximity all communicate before you speak. In a service interaction, an open stance and steady eye contact signal confidence and engagement. A glance at your screen or crossed arms signal the opposite, even when that's not your intent.
Card-Title-BodyLanguage: What Your Body Says
Card-Sig-BodyLanguage: Body Language
Card-Bullets-BodyLanguage: Posture, eye contact, and facial expression communicate before you speak | An open stance and steady eye contact signal confidence | Crossed arms or screen glances undercut your message — even unintentionally
Voiceover-CLICK-ToneOfVoice: Your tone of voice — warmth, pace, and confidence — shapes how your message lands more than word choice does. The same sentence delivered with certainty builds trust; delivered with hesitation creates doubt. Slow down when delivering difficult news. Let your tone match the content.
Card-Title-ToneOfVoice: How You Sound
Card-Sig-ToneOfVoice: Tone of Voice
Card-Bullets-ToneOfVoice: Warmth, pace, and confidence shape how your message lands | Certainty builds trust; hesitation creates doubt | Slow down when delivering difficult or unexpected news
Voiceover-CLICK-Words: The words you choose matter — but they carry less weight than most people assume. Where words matter most is in precision and ownership. "I will take care of that" lands differently than "someone will handle it." Specific, first-person language signals accountability.
Card-Title-Words: What You Say
Card-Sig-Words: Words
Card-Bullets-Words: Words carry less weight than tone or body language | Precision and ownership are where word choice matters most | "I will take care of that" signals accountability — vague language does not
Status: Draft
Notes: card-explore chosen — three parallel, equally weighted concepts. Each requires individual exploration before the learner can move on.
```

---

### `knowledge-check`

**Status:** Standard — parser-generated
**Use when:** Testing comprehension at a natural topic boundary — after every 3–4 content slides throughout the module.
**Avoid when:** Testing end-of-module learning objectives (use `final-quiz`).

**What the learner sees:**
Centered modal card on a dimmed, patterned backdrop. Red accent header with slide title. Question stem. Four lettered options (A–D) as rows. Submit button disabled until an answer is selected. Wrong answer: options dim, "Back to Review" button appears. Correct answer: feedback strip reveals, Next unlocks.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Question` | Full question stem | Test understanding or application — not verbatim recall |
| `Choice-1` through `Choice-4` | One choice per field | All distractors must be plausible |
| `Correct-Answer` | Number 1–4 | Corresponds to the correct `Choice-N` |
| `Review-Slide` | `SLD_CCxx_NNN` | Slide to return to on wrong answer — the most relevant content slide |
| `Voiceover-INTRO` | Standard 2-sentence prompt | Always: `Let's check your understanding. Select the best answer.` |
| `Caption-Text` | ≤120 chars | Always: `Let's check your understanding.` |

**Interaction model:**
- Next locked on entry.
- Wrong answer → all options dim → "Back to Review" button → learner returns to `Review-Slide`.
- Correct answer → feedback strip reveals → Next unlocks.
- No `Voiceover-CLICK-*` fields — no VO plays on answer selection.

**Writing strong questions:**
- One clearly correct answer; three plausible distractors based on real misconceptions.
- Question tests application of understanding, not recall of a specific word or number.
- `Review-Slide` points to the slide that most directly answers the question.

**Example:**
```
## Slide 12 — Knowledge Check 1

Slide-ID: KC_CC00_001
Template-ID: knowledge-check
Slide-Title: Knowledge Check
Question: Which channel of communication carries the largest share of how a message is received?
Choice-1: The specific words chosen
Choice-2: The technical accuracy of the information
Choice-3: Body language and nonverbal cues
Choice-4: The speed of delivery
Correct-Answer: 3
Review-Slide: SLD_CC00_006
>> On slide load → KC_CC00_001_INTRO.mp3
Voiceover-INTRO: Let's check your understanding. Select the best answer.
Caption-Text: Let's check your understanding.
Status: Draft
Notes: knowledge-check chosen — tests the core concept from the communication channels section. Review-Slide points to the content-stat slide with the 55% nonverbal figure.
```

---

### `final-quiz`

**Status:** Standard — parser-generated
**Use when:** End-of-module scored assessment — one question per learning objective, placed after the `closing` slide.
**Avoid when:** Mid-module comprehension checks (use `knowledge-check`).

**What the learner sees:**
Same modal layout as `knowledge-check`. No review loop — after submitting, the learner advances to the next question automatically. All results reported to SCORM.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Question` | Full question stem | |
| `Choice-1` through `Choice-4` | One choice per field | |
| `Correct-Answer` | Number 1–4 | |
| `Voiceover-INTRO` | Short prompt | `Question one. Choose the best answer.` / `Question two. Choose the best answer.` etc. |
| `Caption-Text` | ≤120 chars | Same as VO prompt |

**No `Review-Slide` field.** Final quiz questions do not have a review loop.

**Interaction model:**
- Next locked. Answer + submit → learner advances to next question automatically.
- Results tallied across all `final-quiz` slides; reported by the `quiz-score` slide.

**Example:**
```
## Slide 17 — Final Quiz Question 1

Slide-ID: FQ_CC00_001
Template-ID: final-quiz
Slide-Title: Final Assessment — Question 1
Question: According to the FACE framework, what should you do immediately after a customer explains their concern?
Choice-1: Open the work order and begin documenting
Choice-2: Ask how long they've had the vehicle
Choice-3: Acknowledge what they said and reflect it back
Choice-4: Explain the likely cause and estimated cost
Correct-Answer: 3
>> On slide load → FQ_CC00_001_INTRO.mp3
Voiceover-INTRO: Question one. Choose the best answer.
Caption-Text: Question one. Choose the best answer.
Status: Draft
Notes: final-quiz chosen — tests Objective 3 (apply the FACE framework). Distractors are all plausible service advisor actions.
```

---

### `quiz-score`

**Status:** Standard — parser-generated
**Use when:** Final slide of every module — always after all `final-quiz` slides.
**Avoid when:** Any other position.

**What the learner sees:**
Animated score ring (circular fill) showing the learner's percentage. Pass (≥ 80%) or fail badge with congratulations or encouragement message. SCORM reporting triggered automatically on display.

**Required fields:** Only `Slide-ID` and `Slide-Title`. Do not add any content fields — the slide is fully dynamic.

**Interaction model:** None. Slide reads results from the SCORM runtime and displays them.

**Example:**
```
## Slide 20 — Quiz Score

Slide-ID: FQ_CC00_SCORE
Template-ID: quiz-score
Slide-Title: Module 3 Assessment Results
Status: Draft
Notes: quiz-score chosen — required final slide. Pass threshold 80%. SCORM reporting is automatic. No content fields needed.
```

---

### `closing`

**Status:** Standard — parser-generated
**Use when:** Module wrap-up — always the last content slide before the `final-quiz` sequence begins.
**Avoid when:** Any position other than just before the final quiz slides.

**What the learner sees:**
Module wrap-up layout with heading, brief summary message, optional accent image. Clean and minimal — designed to transition the learner from content into assessment mode.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | e.g. `Module Complete` or `Well Done` | Closing heading |
| `On-Screen-Text` | 1–2 sentence summary | What the learner has accomplished |
| `Image-File` | `descriptive_name_CCxx.webp` | Accent image — aspirational, forward-momentum scene |
| `Voiceover-INTRO` | 3–5 sentences | Brief summary + clear transition to the assessment |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Image` | Art direction if `Image-File` is not yet sourced. Renders as `.img-placeholder` until asset is ready. |

**VO guidance:**
Acknowledge what was covered in the module. Reinforce the single most important takeaway. Transition clearly to the assessment: "In the next section, you'll complete a short assessment to confirm your understanding."

**Example:**
```
## Slide 16 — Module Closing

Slide-ID: SLD_CC00_016
Template-ID: closing
Slide-Title: Module Complete
On-Screen-Text: You've explored the communication skills that separate good service from great service — and learned how to apply them in every customer interaction.
Image-File: porsche_handshake_closing_CC00.webp
>> On slide load → SLD_CC00_016_INTRO.mp3
Voiceover-INTRO: You've covered a lot of ground in this module. You now understand why communication breaks down, how the three channels shape every message you send, and how to use the FACE framework to structure every intake conversation. In the next section, you'll complete a short assessment to confirm your understanding. Take your time and trust what you've learned.
Caption-Text: You've explored the communication skills that separate good service from great service.
Image: Warm, premium wide shot of a Porsche service advisor and customer walking together. Both in motion — forward momentum. Premium service environment.
Status: Draft
Notes: closing chosen — standard module wrap-up. VO transitions clearly to the assessment.
```

---

## Emerging Templates

These templates are implemented as custom HTML in the CC03 module. Write the storyboard block exactly as shown — the HTML is built by hand using the reference implementation as a base and customized with the slide's content. They follow the same field conventions as standard templates.

As each template is tightened and made fully general, it will be promoted to Standard.

---

### `tile-explore`

**Status:** Emerging — reference implementations: `SLD_CC03_004.html`, `SLD_CC03_012.html`
**Use when:** Presenting 3–5 parallel topics where each has a distinct visual identity (poster image) and detailed content (title, description, bullets). Visually richer than `card-explore`.
**Avoid when:** Topics don't have distinct visual identities (use `card-explore`), there are more than 5 tiles (layout breaks), or the depth per topic doesn't justify the tile format.

**What the learner sees:**
Horizontal row of 3–5 tiles. Each tile shows a full-bleed poster image at rest. On click, the selected tile expands and reveals a title, bullet list, and "Explore" CTA while other tiles compress. A signature badge at the top of each tile shows a sequence number and short keyword (e.g. `01 · Accuracy`). Visited tiles show a green checkmark on the badge. Tiles are locked until INTRO VO ends. All tiles must be visited before Next unlocks.

**Label format:** PascalCase, no spaces — `AccurateDiagnosis`, `TrustBuilding`, `ApprovedWork`. The label routes audio, identifies the tile in HTML, and is used as the suffix on all per-tile fields.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | Displayed above the tile row |
| `Slide-Subtitle` | 1–2 sentence intro | Instructional text displayed below the heading |
| `Voiceover-INTRO` | 2–3 sentences | Name the topic and tile count; end with instruction to explore each |
| `Voiceover-CLICK-Label` | One per tile, 2–4 sentences | Plays when tile expands. Expands on the bullets — does not need to repeat them verbatim. |
| `Tile-Title-Label` | One per tile — full display title | e.g. `Tile-Title-AccurateDiagnosis: Accurate Diagnosis Starts Here` |
| `Tile-Sig-Label` | One per tile — short keyword | e.g. `Tile-Sig-AccurateDiagnosis: Accuracy` — sequence number auto-prepended by order |
| `Tile-Bullets-Label` | One per tile — exactly 3 bullets, pipe-separated | e.g. `Tile-Bullets-AccurateDiagnosis: First bullet \| Second bullet \| Third bullet` |
| `Image-Label` | One per tile — filename or art direction | e.g. `Image-AccurateDiagnosis: technician_listening_CC00.webp` |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Audio file naming:** `{SLIDE_ID}_CLICK_{Label}.mp3`

**Interaction model:**
- Tiles locked until INTRO VO ends.
- Click → tile expands + CLICK audio plays.
- Next locked until all tiles visited.
- Visited tiles show a green `✓` on the signature badge.

**VO guidance:**
- INTRO (2–3 sentences): Name the concept category and count. End with explicit instruction to explore each tile.
- CLICK per tile (2–4 sentences): Deliver substantive, specific content. The VO expands the idea — it does not need to read the bullets aloud.

**Example:**
```
## Slide 04 — Listening Is a Technical Skill

Slide-ID: SLD_CC00_004
Template-ID: tile-explore
Slide-Title: Listening Is a Technical Skill
Slide-Subtitle: Before we dive into techniques, let's establish why listening matters so much for someone at your level. Select each tile to explore.
>> On slide load → SLD_CC00_004_INTRO.mp3
Voiceover-INTRO: Listening isn't a soft skill — it's a technical one. How well you hear a customer directly impacts your diagnosis accuracy, your approval rate, and the trust you build. Select each tile to explore why.
Caption-Text: Listening isn't a soft skill — it's a technical one.
>> User clicks AccurateDiagnosis tile → SLD_CC00_004_CLICK_AccurateDiagnosis.mp3
Voiceover-CLICK-AccurateDiagnosis: Customers describe what they experience — a sound, a feeling, an intermittent behavior. They don't speak in diagnostic terms, and they shouldn't have to. Your job is to hear enough detail in that description to know what question to ask next. That translation from customer language to technical language starts with careful listening.
Tile-Title-AccurateDiagnosis: Accurate Diagnosis Starts Here
Tile-Sig-AccurateDiagnosis: Accuracy
Tile-Bullets-AccurateDiagnosis: Customers bring a feeling, a sound, or a behavior — not a diagnosis | Descriptions are often imprecise, but they're your starting point | Careful listening to that description is what gets you to the real problem efficiently
Image-AccurateDiagnosis: technician_listening_01_CC00.webp
>> User clicks TrustBuilding tile → SLD_CC00_004_CLICK_TrustBuilding.mp3
Voiceover-CLICK-TrustBuilding: Trust forms fast — customers decide within the first few moments of your intake whether you're genuinely engaged or just going through the motions. They may not be able to evaluate your technical skills, but they can absolutely tell whether you're listening. That perception shapes every conversation that follows, including how willing they are to approve your recommendations.
Tile-Title-TrustBuilding: Trust Is Built in the Listening
Tile-Sig-TrustBuilding: Trust
Tile-Bullets-TrustBuilding: Trust forms fast — customers can tell within moments whether you're genuinely engaged | Going through the motions is easy to detect | That perception shapes how willing they are to approve your recommendations
Image-TrustBuilding: technician_listening_02_CC00.webp
>> User clicks ApprovedWork tile → SLD_CC00_004_CLICK_ApprovedWork.mp3
Voiceover-CLICK-ApprovedWork: There's a direct line between listening and approved work. When a customer feels heard, they trust your judgment — and when they trust your judgment, they say yes to recommended services. This isn't about sales technique. It's about the natural outcome of a conversation where the customer feels respected and understood.
Tile-Title-ApprovedWork: Listening Leads to More Approved Work
Tile-Sig-ApprovedWork: Approval
Tile-Bullets-ApprovedWork: The connection between listening and approved work is direct | Customers who feel heard are far more likely to approve recommended repairs | Listening is a business skill as much as it is a communication skill
Image-ApprovedWork: technician_listening_03_CC00.webp
Status: Draft
Notes: tile-explore chosen — three parallel concepts with distinct visual identities and substantive per-tile content. Reference implementation: SLD_CC03_004.html.
```

---

### `tab-panel`

**Status:** Emerging — reference implementation: `SLD_CC03_009.html`
**Use when:** Presenting 3–5 named techniques or topics where the learner can explore in any order and doesn't need to visit all tabs.
**Avoid when:** All topics must be visited (use `tile-explore` or `card-explore`), there are more than 5 tabs, or the content is sequential (use `step-sequence`).

**What the learner sees:**
Left panel with stacked tab navigation buttons. Right side shows an image that updates per selected tab. Clicking a tab swaps the content area and plays the tab's VO. Tabs are locked until INTRO VO ends. Next unlocks after the first tab is clicked — visiting all tabs is not required.

**Tab label format:** PascalCase, no spaces — `Paraphrase`, `Clarify`, `PerceptionCheck`, `Summarize`

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | Left panel heading |
| `Voiceover-INTRO` | 2–3 sentences | Name the topic and tab count; invite exploration |
| `Voiceover-TAB-Label` | One per tab, 2–4 sentences | Plays when tab is opened. Label = tab name in PascalCase. **Must be followed immediately by `Tab-Body-Label`.** |
| `Tab-Body-Label` | 1–3 sentences | On-screen text displayed in the tab content panel. Concise summary — not the full VO script. One field per tab, Label matches `Voiceover-TAB-Label`. |
| `Image-File` | `descriptive_name_CCxx.webp` | Default/first-tab image |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Field ordering:** Write each `Voiceover-TAB-Label` immediately followed by its `Tab-Body-Label` on the next line. Parser uses the VO text as fallback if Tab-Body is absent, but the VO is too long for display — always include Tab-Body.

**Audio file naming:** `{SLIDE_ID}_TAB_{Label}.mp3`

**Interaction model:**
- Tabs locked until INTRO VO ends.
- Tab click → content area updates + TAB audio plays.
- Next unlocks after the first tab click. Visiting all tabs is not required.

**VO guidance:**
- INTRO (2–3 sentences): Name the concept and count of techniques. Invite exploration.
- TAB per tab (2–4 sentences): Cover the technique with a practical, specific example.

**Example:**
```
## Slide 13 — Active Listening Techniques

Slide-ID: SLD_CC00_013
Template-ID: tab-panel
Slide-Title: Active Listening Techniques
>> On slide load → SLD_CC00_013_INTRO.mp3
Voiceover-INTRO: There are four active listening techniques that top Porsche service advisors use consistently. Explore each tab to understand how and when to apply it.
Caption-Text: There are four active listening techniques top Porsche advisors use consistently.
Image-File: advisor_listening_CC00.webp
>> User opens Paraphrase tab → SLD_CC00_013_TAB_Paraphrase.mp3
Voiceover-TAB-Paraphrase: Paraphrasing is restating what the customer said in your own words — "So what I'm hearing is that the noise happens mostly at highway speeds, especially when you accelerate. Is that right?" It confirms understanding, gives the customer a chance to correct anything, and signals that you were fully listening. Use it before you start writing the work order.
Tab-Body-Paraphrase: Restate what the customer said in your own words. It confirms understanding and signals you were fully listening. Use it before writing the work order.
Voiceover-TAB-Clarify: Clarifying questions fill in the gaps before they become problems. "When you say it feels off — is that more of a vibration, or more of a pull?" gets to the specific symptom before you've committed to a diagnosis. One precise clarifying question saves more time than three hours of rework.
Tab-Body-Clarify: Ask the one question that fills in the biggest gap. Precision now prevents rework later.
Voiceover-TAB-PerceptionCheck: A perception check confirms you've read the customer's emotional state correctly. "You seem a little uncertain about whether this is worth addressing now — does that sound right?" It opens space for a concern the customer might not have volunteered on their own. Done well, it builds trust immediately.
Tab-Body-PerceptionCheck: Confirm you've read the customer's emotional state. Opens space for concerns they might not volunteer on their own.
Voiceover-TAB-Summarize: Summarizing brings the intake conversation to a clear close — "So here's what we're going to look at today..." followed by everything you heard. It reduces miscommunication before work begins, gives the customer confidence that nothing was missed, and creates a natural transition to the work order.
Tab-Body-Summarize: Close the intake by restating everything you heard. Reduces miscommunication and gives the customer confidence nothing was missed.
Status: Draft
Notes: tab-panel chosen — four techniques of equal weight; learner doesn't need to visit all. Reference implementation: SLD_CC03_009.html.
```

---

### `step-sequence`

**Status:** Emerging — reference implementations: `SLD_CC03_007.html`, `SLD_CC03_014.html`
**Use when:** Content has a clear required order — steps in a process, phases of a framework, or a procedure where sequence matters.
**Avoid when:** Steps are parallel or unordered (use `card-explore` or `tile-explore`).

**What the learner sees:**
Step cards presented in sequence. Each step has a number, title, description, and optional bullets. A Next Step button advances to the next card. Each step's audio must complete before the Next Step button activates. All steps must be completed before the slide's main Next button unlocks.

**`Voiceover-STEP-N` naming:** Always zero-padded to 2 digits — `Voiceover-STEP-01`, `Voiceover-STEP-02`, etc.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | |
| `Voiceover-INTRO` | 2–3 sentences | Set up the sequence; name the framework and step count; tell learner to use the button to advance |
| `Voiceover-STEP-01` through `Voiceover-STEP-N` | One per step, 2–4 sentences | Zero-padded. Plays when that step card activates. |
| `Image-File` | `descriptive_name_CCxx.webp` | Hero or panel image that sets the scene for the sequence |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Image` | Art direction if `Image-File` is not yet sourced. Renders as `.img-placeholder` until asset is ready. |

**Audio file naming:** `{SLIDE_ID}_STEP_{N}.mp3` (e.g. `SLD_CC00_014_STEP_1.mp3`)

**Interaction model:**
- INTRO VO plays on load. First step locked until INTRO VO ends.
- Step activates on button click. Step VO plays.
- Next Step button disabled until that step's VO ends.
- All steps must be completed. Slide Next button unlocks after final step VO ends.

**VO guidance:**
- INTRO (2–3 sentences): Name the framework and step count. Tell the learner to use the button to advance when ready.
- STEP per step (2–4 sentences): Explain the step concretely. Use a brief real-world example if it fits in the sentence count.

**Example:**
```
## Slide 14 — The FACE Framework in Action

Slide-ID: SLD_CC00_014
Template-ID: step-sequence
Slide-Title: The FACE Framework in Action
>> On slide load → SLD_CC00_014_INTRO.mp3
Voiceover-INTRO: Let's walk through the FACE framework one step at a time. Each step builds on the last. Use the arrow to advance when you're ready.
Caption-Text: Let's walk through the FACE framework one step at a time.
>> Step 1 activates → SLD_CC00_014_STEP_1.mp3
Voiceover-STEP-01: Focus. Before the customer says a single word, your attention tells them everything. Put the tablet to the side. Make eye contact. Greet them by name if you have it. A customer who feels like the most important person in the room in those first ten seconds carries that feeling through the entire visit.
>> Step 2 activates → SLD_CC00_014_STEP_2.mp3
Voiceover-STEP-02: Acknowledge. After the customer explains their concern, say it back to them in your own words. Not to repeat it — to confirm you heard it. "So the vibration started about two weeks ago and it's getting more noticeable — is that right?" This one step eliminates more miscommunication than any other.
>> Step 3 activates → SLD_CC00_014_STEP_3.mp3
Voiceover-STEP-03: Clarify. Ask the one question that fills in the biggest gap. Not five questions — one. "Does it happen at all speeds, or mostly above fifty miles per hour?" gets you to the specific symptom without overwhelming the customer. Write the work order only after you've clarified.
>> Step 4 activates → SLD_CC00_014_STEP_4.mp3
Voiceover-STEP-04: Explore. Before you close the intake, ask one open-door question — "Is there anything else you've noticed, or anything else I can help you with today?" This is where deferred maintenance and additional concerns surface. It's also the moment that makes a customer feel genuinely cared for rather than processed.
Status: Draft
Notes: step-sequence chosen — FACE framework has a required order; all four steps must be completed. Reference implementation: SLD_CC03_007.html.
```

---

### `video-scenario`

**Status:** Emerging — reference implementation: `SLD_CC03_008.html`
**Use when:** A video scenario demonstrates a concept better than text — skill application in a real conversation, a before/after comparison, or a situation the learner must evaluate.
**Avoid when:** The video is purely illustrative with no interaction needed (use `content-split` with a `Video-File` field).

**What the learner sees:**
Slide header bar (accent dot, label, title). Intro overlay with play button — locked until INTRO VO ends. Video plays in a centered 16:9 player. Optional pause-point questions stop the video and overlay a multiple-choice card. Summary overlay plays after the video ends. Next unlocks after the summary VO completes.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | Displayed in the header bar |
| `Video-File` | `filename_CCxx.mp4` | Video file. Dual-clip: two filenames comma-separated. |
| `Voiceover-INTRO` | 2–3 sentences | Plays over the intro overlay before the video starts |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Voiceover-Summary` | 2–3 sentences. Plays after video ends, before Next unlocks. |
| `Pause-Question-N` | Pause-point quiz format: `TIMESTAMP \| Question \| A. Option \| B. Option \| C. Option \| D. Option \| Correct: A` |

**Interaction model:**
- INTRO VO plays; play button locked until INTRO VO ends.
- Learner clicks play; video starts.
- Pause-point questions (if present) stop the video; learner must answer before video resumes.
- Summary VO plays after video ends.
- Next unlocks after summary VO completes.

**VO guidance:**
- INTRO (2–3 sentences): Set up the scenario. Tell the learner what to watch for. Do not reveal the outcome.
- Summary (2–3 sentences): Reflect on what was demonstrated. Connect it to the module's lesson.

**Example:**
```
## Slide 15 — Watch: A Service Intake in Action

Slide-ID: SLD_CC00_015
Template-ID: video-scenario
Slide-Title: Watch: A Service Intake in Action
Video-File: face_intake_scenario_CC00.mp4
>> On slide load → SLD_CC00_015_INTRO.mp3
Voiceover-INTRO: Watch this service intake conversation and look for how the advisor applies — or misses — each step of the FACE framework. Pay attention to the moments where the conversation either builds trust or starts to lose it.
Voiceover-Summary: The quality of the intake conversation shapes everything that follows — the customer's expectations, their willingness to approve additional work, and whether they feel confident leaving their vehicle. The FACE framework isn't a script. It's a structure for giving every customer the experience they're already expecting from Porsche.
Caption-Text: Watch and look for how the advisor applies the FACE framework.
Status: Draft
Notes: video-scenario chosen — scenario demonstrates FACE framework application better than text alone. Reference implementation: SLD_CC03_008.html.
```

---

### `bar-chart-modal`

**Status:** Emerging — reference implementation: `SLD_CC03_006.html`
**Use when:** Presenting data broken into 3–4 named categories where each category needs an expanded explanation. Best for statistics that benefit from both a visual proportion AND detailed context per segment.
**Avoid when:** More than 4 categories (layout breaks) or the categories don't need expanded detail (use `content-stat` instead).

**What the learner sees:**
Photo panel on the left. Right panel with animated bar chart — each bar fills to its percentage value on load. Clicking a bar opens a modal with an icon, percentage, label, and bullet explanation. All bars must be clicked before Next unlocks. Bars are locked until INTRO VO ends.

**Bar label format:** PascalCase, no spaces — `BodyLanguage`, `ToneOfVoice`, `Words`

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | |
| `On-Screen-Text` | Brief intro above chart | Context for the data |
| `Voiceover-INTRO` | 3–4 sentences | Introduce the data; tell learner to click each bar |
| `Voiceover-CLICK-Label` | One per bar, 2–4 sentences | Plays when modal opens. Label = category name in PascalCase |
| `Image-File` | `descriptive_name_CCxx.webp` | Left photo panel image |
| `Caption-Text` | ≤120 chars | First sentence of INTRO VO |

**In `Notes` field:** Always specify bar values so the developer knows what percentages to set in the HTML.
Example: `Bar values: BodyLanguage=55%, ToneOfVoice=38%, Words=7%`

**Audio file naming:** `{SLIDE_ID}_CLICK_{Label}.mp3`

**Interaction model:**
- Bars locked until INTRO VO ends.
- Bar click → modal opens + CLICK audio plays.
- Next locked until all bars visited.

**Example:**
```
## Slide 07 — How Communication Really Works

Slide-ID: SLD_CC00_007
Template-ID: bar-chart-modal
Slide-Title: How Communication Really Works
On-Screen-Text: Research shows that how we say something matters far more than what we say.
Image-File: communication_research_CC00.webp
>> On slide load → SLD_CC00_007_INTRO.mp3
Voiceover-INTRO: Here's a striking breakdown of how communication actually works. Most people assume the words carry the message — but the data tells a very different story. Click each bar to understand what that channel really means in a service conversation.
Caption-Text: Research shows that how we say something matters far more than what we say.
>> User clicks BodyLanguage bar → SLD_CC00_007_CLICK_BodyLanguage.mp3
Voiceover-CLICK-BodyLanguage: Body language accounts for fifty-five percent of how a message is received. Every posture choice, every glance at a screen instead of the customer, every crossed arm — it's all being read in real time. Before you've said a single thing, your body language has already told the customer whether this is going to be a good experience.
>> User clicks ToneOfVoice bar → SLD_CC00_007_CLICK_ToneOfVoice.mp3
Voiceover-CLICK-ToneOfVoice: Tone of voice carries thirty-eight percent of the communication signal — pace, warmth, and confidence in how you speak. Customers who can't evaluate the technical side of what you're telling them listen closely to how you sound. Confidence in your voice builds confidence in your recommendation.
>> User clicks Words bar → SLD_CC00_007_CLICK_Words.mp3
Voiceover-CLICK-Words: Words account for just seven percent of how a message is received. That doesn't mean they don't matter — it means they carry less weight than most people assume. Where word choice matters most is ownership and precision: "I'll take care of that" versus "someone will look into it" signals entirely different levels of accountability.
Status: Draft
Notes: bar-chart-modal chosen — 55/38/7 communication breakdown is visual data that benefits from chart + modal detail. Bar values: BodyLanguage=55%, ToneOfVoice=38%, Words=7%. Reference implementation: SLD_CC03_006.html.
```

---

### `drag-match`

**Status:** Emerging — reference implementations: `SLD_CC08_003.html`, `SLD_CC08_016.html`
**Use when:** Learners need to actively connect two sets of related items — step names to descriptions, terms to definitions, concepts to examples. Requires recall rather than recognition; more engaging than reading a list.
**Avoid when:** Items are parallel, self-contained concepts with no natural pairing (use `card-explore` or `tile-explore`), or the content is sequential (use `step-sequence`).

**What the learner sees:**
Left column of draggable chips (items); right column of labeled drop zones (targets). Right side of the slide shows a supporting image with a gradient scrim. Column headers label each side. INTRO VO plays on load; interactions lock until INTRO ends. Next unlocks after all items are correctly placed.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | Displayed at the top of the slide |
| `On-Screen-Text` | 1 sentence instruction | Always an action: "Drag each [term] to its matching [definition]." |
| `Match-Col-Left` | Short label | Column header for draggable items — e.g. "Steps", "What You Say", "Terms" |
| `Match-Col-Right` | Short label | Column header for drop targets — e.g. "Descriptions", "What They Hear", "Definitions" |
| `Image-File` | `descriptive_name_CCxx.webp` | Right-panel image. Required — layout has a dedicated image slot. |
| `Image` | Art direction | Describe scene; used as art direction note until asset is ready. |
| `Voiceover-INTRO` | 2–3 sentences | Frames what's being matched and ends with the action instruction. |
| `Match-N-Item` | ≤5 words | Short draggable label. Supports Match-1 through Match-10. |
| `Match-N-Target` | 1 sentence | The matching definition or description for item N. |

**Important:** `Match-Col-Left` and `Match-Col-Right` must each be on their own line (Rule S1). If omitted they default to "Terms" / "Definitions" — always provide them; generic defaults read as placeholder content.

**Optional fields:**

| Field | Notes |
|-------|-------|
| `Caption-Text` | ≤120 chars — first sentence of INTRO VO |

**Pair count:** 4–7 pairs. Fewer than 4 feels trivial; more than 7 gets visually crowded.
**Audio:** Single `Voiceover-INTRO` clip only. No per-pair audio.
**Next lock:** Unlocks when all items are placed correctly.

**Example:**

```
## Slide 16 — The Seven Steps

Slide-ID: SLD_CC08_016
Template-ID: drag-match
Slide-Title: The Seven Steps of a Great Explanation
Caption-Text: Every strong technical explanation follows the same seven steps.
On-Screen-Text: Every strong technical explanation follows the same seven steps. Drag each step name to its matching description.
Match-Col-Left: Steps
Match-Col-Right: Descriptions
Image-File: technician_explaining_CC08.webp
Image: A Porsche technician at a service counter, gesturing calmly toward a printed inspection sheet as the customer listens.
Voiceover-INTRO: Every strong technical explanation follows the same structure. On the left — seven step names. On the right — what each step actually does. Drag each step to its matching description.
Match-1-Item: Name the Part
Match-1-Target: Identify the specific component so the customer knows exactly what you're talking about.
Match-2-Item: Describe the Job
Match-2-Target: Explain in plain language what that part is supposed to do.
[...continue for all 7 pairs...]
Status: Draft
Notes: drag-match chosen — active recall of explanation framework steps. 7 pairs.
```

---

### `hotspot`

**Status:** Emerging — reference implementation: `SLD_CC08_009.html` (when built)
**Use when:** 3–5 distinct discovery points belong to a single visual scene — a service bay, a vehicle diagram, a customer interaction, a process flow. Each point opens a modal with a coached explanation. Spatial meaning matters: the marker position on the image conveys which part of the scene is being discussed.
**Avoid when:** Topics are parallel/conceptual rather than spatially anchored (use `tile-explore`), or there are more than 5 points (layout becomes crowded).

**What the learner sees:**
Full-bleed background image. Numbered circular markers positioned over specific image regions. Clicking a marker opens a modal card with a title, body text, and VO narration. All markers must be visited before Next unlocks. INTRO VO plays on load; markers lock until INTRO ends.

**Required fields:**

| Field | Format | Notes |
|-------|--------|-------|
| `Slide-Title` | Section heading | Displayed top-left over the image |
| `On-Screen-Text` | 1 instruction sentence | Always: "Select each marker to explore [topic]." |
| `Image-File` | `descriptive_name_CCxx.webp` | Full-bleed background image. Markers are positioned over it. |
| `Image` | Art direction | Describe what's in each region — the artist must place visual detail near each marker's position. |
| `Voiceover-INTRO` | 2–3 sentences | Name the topic, count the hotspots, end: "Select each marker to explore." |
| `Hotspot-N-X` | 0–100 (% of image width) | Horizontal position. 0 = left edge, 100 = right edge. |
| `Hotspot-N-Y` | 0–100 (% of image height) | Vertical position. 0 = top edge, 100 = bottom edge. |
| `Hotspot-N-Title` | ≤6 words | Heading displayed in the modal card. |
| `Hotspot-N-Body` | 1–3 sentences | Visible on-screen text inside the modal. Concise summary. |
| `Voiceover-CLICK-HotspotN` | 2–4 sentences | Full coached explanation. Expands on body — do not repeat verbatim. |

**Placement rules:**
- Keep markers at least 15% apart to prevent overlap.
- Keep markers at least 8% from any image edge.
- Use the `scripts/hotspot-picker.html` browser tool to place markers interactively and copy storyboard output directly.

**Audio:** INTRO clip + one `Voiceover-CLICK-HotspotN` per hotspot. A 4-hotspot slide = 5 audio files. Plan for production accordingly.

**Example:**

```
## Slide 09 — Reading the Moment

Slide-ID: SLD_CC08_009
Template-ID: hotspot
Slide-Title: Reading the Moment
On-Screen-Text: Select each marker to explore a signal that tells you how to frame your recommendation.
Image-File: service_counter_CC08.webp
Image: Wide shot of a Porsche service counter. Customer standing at the left, technician facing them on the right. Four clearly distinct zones: customer's face/body language (upper left), the printed inspection sheet on the counter (center), the technician's hands (lower right), the service bay visible through the glass behind (background center).
Voiceover-INTRO: Reading the moment means knowing which framing your customer needs before you speak. There are four signals that tell you. Select each marker to explore them.
Hotspot-1-X: 22
Hotspot-1-Y: 38
Hotspot-1-Title: Customer Body Language
Hotspot-1-Body: A customer who leans in and makes eye contact is ready to engage. One who folds their arms or checks their phone needs a different opening.
Voiceover-CLICK-Hotspot1: Body language tells you the customer's emotional state before they say a word. Leaning in, making eye contact, nodding — they're engaged and ready to receive information. Pulled back, arms folded, phone in hand — they're uncertain or pressed for time. That signal changes how you open: more context versus a faster path to the bottom line.
[...continue for hotspots 2–4...]
Status: Draft
Notes: hotspot chosen — 4 reading-the-moment signals belong to a single service counter scene. Each marker anchors to a specific visual zone. 5 audio files total.
```

---

## Undocumented Template IDs

These IDs appear in the system's field reference but have no implementation or documentation. Do not use them.

| Template-ID | Status | Notes |
|-------------|--------|-------|
| `split-explore` | Planned — not implemented | No HTML template exists. Possibly a split layout with interactive explore panel. |
| `video-bg` | Planned — not implemented | No HTML template exists. Possibly a content slide with looping video background. |

---

## Field Quick Reference

| Field | Required on | Format / Constraint |
|-------|------------|---------------------|
| `Slide-ID` | All | `SLD_CCxx_NNN` / `KC_CCxx_NNN` / `FQ_CCxx_NNN` / `FQ_CCxx_SCORE` — underscores only, never hyphens |
| `Template-ID` | All | See template catalog above |
| `Slide-Title` | All | Display title shown in course menu |
| `Slide-Subtitle` | `tile-explore` | 1–2 sentence instructional intro displayed below the heading |
| `Hero-Subtitle` | `hero-title` | e.g. `Module 3 of 12` |
| `Objective-N` | `objectives` | Verb-first format. Parser stops at first missing number. Max 10. Missing fields produce placeholder HTML — treat as build error. |
| `VO-Cue-N` | `objectives` | Seconds from INTRO audio start for per-objective emphasis animation. Set after VO recording. |
| `On-Screen-Text` | Most content templates | See per-template format notes — `content-stat` requires `VALUE Label` format |
| `Pull-Quote` | `content-split` (optional) | Replaces `On-Screen-Text`. One sentence. Never use both. |
| `Quote` | `content-quote` | ≤25 words for visual impact |
| `Quote-Attribution` | `content-quote` | Speaker first and last name |
| `Quote-Title` | `content-quote` | Speaker role or context |
| `Image-File` | All templates except `knowledge-check`, `final-quiz`, `quiz-score` | `descriptive_name_CCxx.webp` — lowercase, underscores, module suffix. Add once asset is ready. |
| `Image` | All templates except `knowledge-check`, `final-quiz`, `quiz-score` | Art direction: subject, mood, composition, setting. **Always include.** Renders as `.img-placeholder` until `Image-File` is provided. |
| `Video-File` | `video-scenario` | `filename_CCxx.mp4` — dual-clip: two filenames comma-separated |
| `Voiceover-INTRO` | All slides with audio | Full VO script — see per-template length guidance below |
| `Voiceover-CLICK-Label` | `card-explore`, `tile-explore`, `bar-chart-modal` | PascalCase label: `ServiceQuality` |
| `Match-Col-Left` | `drag-match` | Column header for draggable items — e.g. "Steps", "Terms", "What You Say". Must be on its own line. |
| `Match-Col-Right` | `drag-match` | Column header for drop targets — e.g. "Descriptions", "Definitions", "What They Hear". Must be on its own line. |
| `Match-N-Item` | `drag-match` | Draggable chip label — ≤5 words. Supports Match-1 through Match-10. |
| `Match-N-Target` | `drag-match` | Drop zone content — 1 sentence matching definition or description. |
| `Hotspot-N-X` | `hotspot` | Horizontal position 0–100 (% of image width). One per hotspot. |
| `Hotspot-N-Y` | `hotspot` | Vertical position 0–100 (% of image height). One per hotspot. |
| `Hotspot-N-Title` | `hotspot` | Modal heading — ≤6 words. |
| `Hotspot-N-Body` | `hotspot` | Visible modal text — 1–3 sentences. Concise summary; VO carries the full explanation. |
| `Voiceover-CLICK-HotspotN` | `hotspot` | Per-marker VO — 2–4 sentences. Required for every hotspot. |
| `Tile-Title-Label` | `tile-explore` | Per-tile full display title: `Tile-Title-AccurateDiagnosis: Accurate Diagnosis Starts Here` |
| `Tile-Sig-Label` | `tile-explore` | Per-tile short keyword for badge: `Tile-Sig-AccurateDiagnosis: Accuracy` — sequence number auto-prepended |
| `Tile-Bullets-Label` | `tile-explore` | Exactly 3 bullets pipe-separated: `Tile-Bullets-AccurateDiagnosis: Bullet 1 \| Bullet 2 \| Bullet 3` |
| `Image-Label` | `tile-explore` | Per-tile image: `Image-AccurateDiagnosis: technician_CC00.webp` |
| `Voiceover-TAB-Label` | `tab-panel` | PascalCase label: `Paraphrase` — follow immediately with `Tab-Body-Label` |
| `Tab-Body-Label` | `tab-panel` | On-screen display text for each tab. 1–3 sentences. Must match the Label in `Voiceover-TAB-Label`. |
| `Voiceover-STEP-NN` | `step-sequence` | Zero-padded: `01`, `02`, `03` |
| `Bullet-1` through `Bullet-N` | `content-bullets` | One bullet per field, plain text, no leading dash. Parser stops at first missing number. Max 10. |
| `Voiceover-Summary` | `video-scenario` (optional) | 2–3 sentences. Plays after video ends. |
| `Caption-Text` | All slides with audio | ≤120 chars — first sentence or key phrase from INTRO VO |
| `Question` | `knowledge-check`, `final-quiz` | Full question stem |
| `Choice-1` – `Choice-4` | `knowledge-check`, `final-quiz` | One per field — all distractors must be plausible |
| `Correct-Answer` | `knowledge-check`, `final-quiz` | Number 1–4 corresponding to the correct `Choice-N` |
| `Review-Slide` | `knowledge-check` only | `SLD_CCxx_NNN` — the most relevant content slide; not used on `final-quiz` |
| `Status` | All | `Draft`, `In Review`, or `Approved` |
| `Notes` | All | Template rationale + production notes (e.g. bar values, reference implementation) |

---

## VO Length Quick Reference

| Template | INTRO | CLICK / TAB / STEP |
|----------|-------|---------------------|
| `hero-title` | 3–5 sentences | — |
| `objectives` | 1 intro sentence + 1 per objective | — |
| `content-split` | 4–7 sentences | — |
| `content-stat` | 4–6 sentences | — |
| `content-bullets` | 4–7 sentences | — |
| `content-quote` | 4–6 sentences (read quote first) | — |
| `card-explore` | 2–3 sentences | 2–4 sentences per card |
| `tile-explore` | 2–3 sentences | 2–4 sentences per tile |
| `tab-panel` | 2–3 sentences | 2–4 sentences per tab |
| `step-sequence` | 2–3 sentences | 2–4 sentences per step |
| `video-scenario` | 2–3 sentences (setup only) | 2–3 sentences (summary, after video) |
| `bar-chart-modal` | 3–4 sentences | 2–4 sentences per bar |
| `knowledge-check` | 2 sentences — standard prompt only | — |
| `final-quiz` | 1 sentence — question number only | — |
| `closing` | 3–5 sentences | — |
| `quiz-score` | none | — |
