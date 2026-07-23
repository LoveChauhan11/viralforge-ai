# Product Requirements

## Vision

ViralForge AI (ForgeOS) is a mobile-responsive production studio that turns a creator's local photos and videos into coherent, data-informed YouTube Shorts. It reduces creation from hours to a guided review lasting minutes while preserving creator control.

## Primary user jobs

- Upload phone or camera media from mobile or desktop.
- Turn mixed raw media into one 15–30 second vertical story.
- Use current hook, pacing, transition, and audio patterns relevant to the creator.
- Review and correct AI decisions before rendering.
- Publish with compliant metadata and a thumbnail.
- Learn which creative choices improve retention, replays, and engagement.

## MVP scope

Included:

- Authentication, one creator workspace, and Creator DNA onboarding.
- Resumable uploads for common phone video and image formats.
- Media normalization, proxies, metadata, transcription, scene detection, semantic labels, quality scores, and safety checks.
- Trend snapshots from permitted APIs, public sources, and curated signals.
- Three creative directions, structured story, shot plan, captions, transitions, CTA, and audio recommendation.
- Deterministic FFmpeg rendering at 9:16 with a hard 30-second maximum.
- Preview, regenerate, trim, reorder, replace, caption edit, locks, and safe-area checks.
- YouTube OAuth, resumable upload, metadata, visibility, scheduling where supported, and analytics.
- Approved Option 1 music handoff.
- Creator-specific learning based on YouTube performance and manual corrections.
- Job status, retries, useful errors, and final MP4 download.

Excluded from MVP:

- Multi-platform publishing.
- Automatic attachment of tracks from the YouTube Shorts music library.
- Face or voice replacement.
- Multi-seat collaboration.
- Desktop-grade free-form timeline editing.
- Training foundation models.
- Unattended publishing by default.

## Golden path

1. User completes Creator DNA and connects YouTube.
2. User starts a project and uploads media.
3. ForgeOS analyzes assets and proposes three directions.
4. User chooses a direction.
5. ForgeOS creates a versioned story and edit decision list.
6. A low-resolution preview is rendered.
7. User edits or locks decisions and approves.
8. ForgeOS renders and technically validates the master.
9. User approves title, description, hashtags, thumbnail, visibility, and schedule.
10. ForgeOS uploads the Short.
11. If Shorts-library music was chosen, the user adds the recommended track inside YouTube and confirms.
12. ForgeOS ingests metrics and updates Creator DNA.

## Requirements

- Source assets are immutable; creative outputs are versioned.
- Each render records source ranges, transformations, model/prompt versions, and FFmpeg recipe.
- AI outputs must match versioned JSON schemas.
- Any creative decision can be locked before regeneration.
- Failed jobs resume safely from the last successful stage.
- Runtime validation enforces current platform metadata limits.
- The product never promises virality.
- Final publication requires explicit approval in MVP.
- Deletion covers source media and derived artifacts.

## Non-functional targets

- Responsive from 360 px width and WCAG 2.2 AA for the core path.
- API p95 below 500 ms for non-media endpoints.
- Preview target below 3 minutes and master below 5 minutes under nominal load.
- 99.5% monthly API availability target.
- Idempotent jobs, structured logs, traces, metrics, audit events, and project cost attribution.
- Encryption in transit and at rest.

## Success metrics

North star: approved, published Shorts per active creator per week.

Activation: first upload, preview, and YouTube connection completed.

Quality: preview-to-approval rate, manual edits per approved Short, media-QC pass rate, publication success, and upload-to-master time.

Outcomes: viewed versus swiped, average percentage viewed, retention curve, rewatch proxy, engagement, and subscribers attributed. Compare performance to the creator's trailing baseline, not a global vanity score.

## Guardrails

Use YouTube APIs and permitted data only. Do not scrape authenticated pages or bypass controls. Do not render third-party music without rights. Treat trends as time-bounded hypotheses with provenance and confidence.
