# FFmpeg Recipe, Caption, and Transition Catalogue

FFmpeg executes only compiled, allowlisted render plans. Never construct a shell string from user/model text. Spawn the pinned binary with an argument array; text enters through escaped files or controlled filter inputs.

## Canonical output profiles

| Profile | Geometry/FPS | Video | Audio | Purpose |
|---|---|---|---|---|
| `preview-v1` | 540×960, 30 fps | H.264, yuv420p, CRF 28, faststart | AAC 96k, 48 kHz | interactive preview |
| `master-v1` | 1080×1920, 30 fps | H.264 High, yuv420p, CRF 18, max 20 Mbps, faststart | AAC 192k, 48 kHz | YouTube upload |

Duration: adaptive 15,000–30,000 ms; forced mode 30,000 ms within one frame. Sources are normalized before composition. Output metadata strips source paths/device identifiers.

## Crop and fit tokens

- `fill-center`: scale to cover, centered crop.
- `fit-blur`: contain foreground over scaled blurred background.
- `auto-subject`: deterministic crop path supplied as numeric keyframes by analysis; fallback `fill-center`.
- `photo-kenburns-in`, `photo-kenburns-out`, `photo-pan-left`, `photo-pan-right`: bounded scale/pan.

Portrait safe areas: keep essential captions/CTA inside x=72..1008 and y=180..1540. Bottom 380 px and rightmost 160 px are UI-risk zones; faces/key subjects should avoid them where possible.

## Transition tokens

| Token | Default/range | Recipe semantics | Use |
|---|---|---|---|
| `cut` | 0 | concatenate on frame boundary | default; any shot |
| `crossfade` | 200 ms / 100–500 | `xfade=fade` plus audio acrossfade | related scenes |
| `dip-black` | 250 ms / 150–500 | fade out/in through black | beat/section change |
| `slide-left` | 250 ms / 150–400 | `xfade=slideleft` | directional motion |
| `slide-up` | 250 ms / 150–400 | `xfade=slideup` | reveal/progression |
| `zoom-in` | 220 ms / 150–350 | allowlisted zoom transition | intensity |
| `flash` | 100 ms / 67–167 | white color blend, luminance bounded | rare beat accent |

Rules: transition duration is overlap and must be included in timeline compilation; never place two transitions on one boundary; no rapid flash pattern; reduced-motion UI affects preview controls, not final creator-approved export.

## Speed tokens

`normal=1.0`; `slow=0.5..0.9`; `fast=1.1..2.0`; `ramp-in` and `ramp-out` use compiler-generated segments, each ≥300 ms. Audio is muted or tempo-adjusted only inside supported 0.5–2.0 range. Source ranges are validated after speed conversion.

## Caption catalogue

| Token | Position | Typography | Behaviour |
|---|---|---|---|
| `impact-center` | center-safe | bold uppercase, high contrast | 1–2 lines, phrase highlight |
| `clean-bottom` | above bottom risk zone | semibold mixed case | 1–2 lines |
| `word-pop` | center/lower-center | bold | active word highlight; max 4 words shown |
| `minimal-top` | top-safe | medium mixed case | contextual label |
| `cta-card` | center-safe | bold plus background panel | final 1.5–3 seconds only |

Font files are packaged and licence-recorded. Default size master 72 px (min 56, max 96), line height 1.05–1.2, max 32 visible characters/line and two lines. Text is normalized UTF-8, bidi-aware, glyph-checked, and rendered from an escaped subtitle/ASS file. Background/outline must meet 4.5:1 effective contrast.

Caption timing: minimum cue 500 ms; reading target ≤17 characters/sec except intentional ≤800 ms impact words; no overlapping normal cues; word timestamps clamp to shot/timeline bounds.

## Overlays

Allowlisted tokens: `title-card`, `location-label`, `progress-bar`, `creator-logo`, `cta-card`. Values are bounded text, color token, placement token, start/end, and optional authorized asset ID. External URLs, HTML/SVG scripts, arbitrary fonts, filter expressions, and filesystem paths are prohibited.

## Audio recipes

- `original`: source audio, loudness-normalized.
- `original-ducked`: original plus licensed/original track, sidechain/automation from compiled numeric envelope.
- `licensed-track`: verified authorized object plus optional original mix.
- `silent`: no audio stream or encoded silence according to platform test.
- `youtube-mobile-handoff`: render original/silent only; recommendation stays outside FFmpeg.

Master targets: integrated loudness −14 LUFS ±2; true peak ≤−1 dBTP; no clipping; fade ≤100 ms at hard edits when needed. Never download or embed a YouTube Shorts-library track.

## Canonical compilation outline

1. Verify source checksum and probe facts.
2. Normalize rotation/color/time base and create source segments with `trim/atrim`, `setpts/asetpts`.
3. Apply numeric crop/scale/pad and speed.
4. Compose transitions and concatenate against the frame-resolved timeline.
5. Render captions/overlays from allowlisted templates.
6. Build normalized audio graph.
7. Encode profile to a partial object.
8. Probe and QC; atomically promote only on pass.

## QC thresholds

- Exact 1080×1920 (master), 30 fps CFR, H.264/yuv420p, AAC where audio exists.
- Duration within project rule and EDL within one frame.
- Decode completes; no unexpected black/frozen interval >500 ms; no blank output.
- Caption bounding boxes stay safe and glyph coverage passes.
- Loudness/peak passes when audio exists.
- Output checksum, source checksums, EDL hash, recipe version, FFmpeg version, command manifest (redacted paths), and QC report are retained.

## Test catalogue

Every crop, transition, speed, caption, overlay, and audio token has a synthetic fixture and compiler snapshot. Mixed orientation, VFR, 23.976/25/30/60 fps, rotation, HDR-to-SDR, silent, clipped audio, non-Latin glyphs, long captions, and corrupt input are required. Pixel/audio hashes may use documented tolerances across approved runtime builds; recipe changes invalidate cache keys.
