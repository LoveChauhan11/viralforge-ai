# Media Pipeline

## Input acceptance

Allow MP4, MOV, WebM, JPEG, PNG, and HEIC only after server-side content inspection. Configurable limits: 2 GB per asset, 60 minutes per video, 100 assets per project. Reject archives, malformed containers, extreme dimensions, decompression bombs, and mismatched extensions.

Browser calculates a checksum and performs multipart upload directly to object storage. API completion verifies object presence, size, and checksum before analysis.

## Analysis stages

1. **Probe** — ffprobe extracts streams, codecs, duration, dimensions, rotation, frame rate, color, and audio layout.
2. **Normalize** — create a stable proxy with corrected rotation, square pixels, supported codec, normalized timestamps, and limited resolution.
3. **Thumbnails/waveform** — generate poster frames, contact sheet, and audio waveform.
4. **Transcript** — speech-to-text with word timestamps and language detection; retain confidence.
5. **Shot detection** — cuts and scene boundaries; minimum/maximum useful shot duration.
6. **Visual facts** — exposure, blur, motion, face/subject position, duplicates, black frames, and orientation.
7. **Semantic facts** — bounded labels and candidate moments.
8. **Safety** — flag content requiring review; do not silently delete.
9. **Persist** — store versioned derivative manifest and mark asset ready.

Each stage is independently retryable and stores its generator version.

## Planning contract

The AI does not write FFmpeg commands. It writes an EDL using supported primitives. A compiler validates it and produces a canonical render recipe.

Supported MVP primitives:

- Cut and short crossfade.
- Source trim.
- Scale/crop/pad with subject anchor.
- Limited speed change.
- Caption burn-in from style tokens.
- Text/CTA overlay from safe templates.
- Basic zoom/pan for still images.
- Original audio gain and ducking.
- Optional licensed/original soundtrack.
- Color normalization and loudness normalization.

Unsupported primitives fail validation before render.

## Rendering

Preview: 540×960, 30 fps, fast preset, bounded bitrate. Master: 1080×1920, H.264 High profile, AAC when audio exists, yuv420p, constant frame rate, fast-start MP4. Exact settings remain configurable and tested against current YouTube guidance.

Render in a unique temporary directory. Download only required source ranges when feasible. Use argument arrays rather than shell interpolation. Set CPU, wall-time, output-size, and temporary-disk limits. Capture sanitized stderr and progress.

## Technical QC

- Container decodes from start to end.
- Duration above zero and at most 30 seconds.
- 9:16 master dimensions and expected pixel format.
- No black/frozen terminal frames beyond threshold.
- Audio has no clipping and meets target loudness when present.
- Captions and essential subjects stay within configured safe areas.
- No missing frames or timestamp discontinuities.
- Output checksum and manifest stored.

A failed QC master cannot be published.

## Versioning and reproducibility

Every render stores EDL schema version, compiler version, FFmpeg build, source checksums, font/style versions, render settings, and output checksum. Re-rendering the same version should be visually deterministic within defined codec tolerance.

## Performance

Use separate preview and master queues. Measure seconds rendered per source second, peak memory, temp disk, egress, and cost. Admission control considers asset size and worker capacity. Jobs heartbeat and can be recovered when leases expire.
