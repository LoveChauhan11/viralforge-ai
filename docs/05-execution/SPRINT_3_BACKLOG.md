# Sprint 3 — Storyboard and Deterministic Rendering

Goal: creators can inspect and edit a storyboard, then receive reproducible preview and master renders that pass technical QC.

## S3-01 EDL compiler

Compile validated EDL V1 into a canonical render plan with resolved frames, time bases, crops, overlays, caption cues, audio graph, and recipe versions.

Acceptance:

- Same source checksums plus plan plus runtime version yield the same logical output.
- Unsupported tokens fail before queueing FFmpeg.
- Compiler has unit fixtures for every catalogue primitive.

## S3-02 Preview renderer

Implement low-resolution preview queue, progress stages, cancellation, timeout, resource limits, artifact lineage, and cache key.

Acceptance:

- Duplicate requests reuse a valid cached preview.
- Cancellation terminates the child process and cleans partial files.
- Worker restart safely resumes or retries.

## S3-03 Master renderer

Implement 1080×1920 H.264/AAC master rendering using pinned FFmpeg runtime and isolated temporary workspace.

Acceptance:

- No user-provided value is interpolated into a shell command.
- Runtime CPU, memory, disk, and duration are bounded.
- Partial outputs are never published as valid masters.

## S3-04 Caption engine

Implement catalogue caption styles, line breaking, word highlighting, font packaging, safe zones, collision checks, and fallback glyph handling.

Acceptance:

- Captions remain readable at 360 px preview scale.
- Missing glyphs or fonts fail QC with a clear remedy.
- Reduced-motion preview does not alter exported render.

## S3-05 Transition and audio engine

Implement cut, dip, crossfade, slide, zoom, speed ramp, original-audio mix, ducking, loudness normalization, and licensed/original track inputs only.

Acceptance:

- Transition overlap cannot change intended total duration.
- Master integrated loudness and true peak meet catalogue thresholds.
- Shorts-library recommendations remain metadata-only.

## S3-06 Technical QC

Probe rendered files for dimensions, codec, duration, frame cadence, black frames, frozen output, audio clipping, silence intent, caption bounds, and checksum.

Acceptance:

- A master cannot become `ready` until required checks pass.
- QC reports retain recipe/runtime versions and safe failure detail.
- Known-bad fixtures fail the expected rule.

## S3-07 Storyboard editor

Build responsive shot list/timeline with trim, reorder, replace, caption edit, transition choice, lock, undo/redo, autosave, and conflict recovery.

Acceptance:

- Mobile uses accessible forms and ordered cards; desktop adds timeline affordances.
- Every edit is validated server-side and creates/forks the correct version.
- Unsaved, saving, saved, conflict, and offline states are explicit.

## S3-08 Version comparison and download

Provide side-by-side metadata/story comparison, synchronized previews, master download, filename rules, and expiry-aware URLs.

Acceptance:

- Download is authorized, audited, and never exposes an object key.
- Comparison identifies creator locks and AI changes.
- Expired URL refresh does not create a new render.

## S3-09 Render operations

Add queue priority, per-workspace concurrency, quota reservation/settlement, dead-letter replay, storage cleanup, metrics, and runbook.

Acceptance:

- One workspace cannot starve the queue.
- Failed/canceled renders release unused quota.
- Operators can diagnose by job ID without opening private media.

## S3-10 Sprint release gate

Run golden render hashes/tolerances, mixed-media E2E, accessibility, worker-kill, load, security, and staging smoke evidence; update memory and contracts.

Dependencies: S3-01 → S3-02/S3-03/S3-04/S3-05 → S3-06; S3-07 → S3-08; S3-09 spans render work; S3-10 closes.

Exit: mixed portrait/landscape/photo assets produce an editable preview and QC-passing 1080×1920 master between 15 and 30 seconds, reproducibly and safely.
