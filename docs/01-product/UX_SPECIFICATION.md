# UX Specification

## Navigation

Keep the product small and decision-led:

- **Today** — next best action, active jobs, failures, and recent performance.
- **Create** — upload-to-publish wizard and project history.
- **Insights** — trends, experiments, and learning.
- **Library** — source assets, brand elements, and templates.
- **Settings** — Creator DNA, YouTube, privacy, billing, and integrations.

## Create wizard

### 1. Goal

Project name, objective, audience, duration, language, CTA, and publish intent. Defaults come from Creator DNA with a short explanation.

### 2. Upload

Drag-and-drop, file picker, and mobile camera roll. Each asset shows progress, duration, resolution, orientation, and detected issues. Uploads survive interruption and continue when the user leaves the page.

### 3. Direction

Show three cards: trend-aligned, creator-style, and experimental. Each includes hook, story, duration, transition family, audio recommendation, evidence freshness, and confidence.

### 4. Storyboard

Mobile uses a vertical shot list. Desktop shows preview beside the list. Each shot includes thumbnail, source in/out, duration, crop, caption, transition, reason, and warning. Controls are trim, replace, reorder, lock, and delete. Global controls cover captions, pacing, CTA, brand preset, and safe-zone overlay.

### 5. Preview

Show the low-resolution preview and validation report. Regeneration respects locked choices. Users can compare current and previous versions. Errors identify the failed stage and recovery action.

### 6. Publish

Fields: title with live counter, description, hashtags, thumbnail, audience declaration, visibility, schedule, channel, and optional playlist. The publish button states the resulting visibility.

For Shorts-library music, show track, artist, suggested segment, suggested volume, a handoff link where supported, and exact steps to add it inside YouTube. Status remains **Waiting for music confirmation** until confirmed.

## Today

One primary action: continue the most relevant project or create the next Short. Secondary cards show jobs requiring attention, queue, opportunities matching available media, and the last experiment result.

## Insights

Answer four questions instead of presenting a wall of charts:

- What worked?
- What changed?
- What should I try next?
- How reliable is that recommendation?

Every recommendation links to supporting Shorts, variables, cohort, and baseline.

## Job states and recovery

Queued, running, succeeded, retrying, failed, and canceled. Show stage, progress, and recovery. Preserve wizard and storyboard state after refresh. If publishing is unavailable, retain download/export.

## Accessibility

Keyboard-operable flow, visible focus, semantic labels, 44×44 touch targets, reduced-motion support, no color-only status, and no unintended horizontal scrolling at 360 px. Validate Shorts safe areas for platform controls and captions.

Use direct copy such as “Analyzing 8 clips” and “Render failed during caption burn-in.” Avoid “AI magic,” guaranteed virality, or unexplained scores.
