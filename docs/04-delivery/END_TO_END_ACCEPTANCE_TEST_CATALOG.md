# End-to-End Acceptance-Test Catalogue

P0 blocks release; P1 blocks sprint exit unless explicitly accepted; P2 may be scheduled with owner approval. Tests run with synthetic/right-cleared data. Each result records requirement/test ID, commit, environment, browser/device, time, evidence, and defect link.

## Identity and tenancy

| ID | Pri | Scenario / expected result |
|---|---:|---|
| E2E-AUTH-01 | P0 | Unauthenticated protected route/API redirects or returns 401 without data. |
| E2E-AUTH-02 | P0 | Workspace A member cannot discover/read/mutate Workspace B asset, project, job, URL, analytics, or connection. |
| E2E-AUTH-03 | P0 | Editor cannot approve/publish; viewer cannot mutate; owner/admin matrix succeeds. |
| E2E-AUTH-04 | P0 | Last owner cannot be demoted/removed. |
| E2E-AUTH-05 | P0 | Expired signed URL and copied cross-user URL fail. |
| E2E-AUTH-06 | P1 | Support access requires grant/reason/expiry and emits audit evidence. |

## Upload and media

| ID | Pri | Scenario / expected result |
|---|---:|---|
| E2E-MED-01 | P0 | Upload valid video, observe progress, ready asset, proxy, poster, probe and shots. |
| E2E-MED-02 | P0 | Interrupt multipart upload, refresh/device reconnect, resume without reuploading completed parts. |
| E2E-MED-03 | P0 | Duplicate complete request returns one asset and analysis workflow. |
| E2E-MED-04 | P0 | Oversize, spoofed MIME, bad checksum and corrupt media are rejected safely and cleaned. |
| E2E-MED-05 | P1 | Rotated/VFR/HDR/silent/multilingual fixture gets documented normalization outcome. |
| E2E-MED-06 | P0 | Delete removes derivatives/original asynchronously; in-use conflict is clear; wrong tenant cannot delete. |
| E2E-MED-07 | P1 | Provider transcription outage yields partial inspectable analysis and bounded retry. |

## Planning and AI

| ID | Pri | Scenario / expected result |
|---|---:|---|
| E2E-AI-01 | P0 | Analyzed project returns exactly three distinct, grounded directions referencing only eligible shots. |
| E2E-AI-02 | P0 | EDL validates all IDs/ranges/tokens/safe zones and duration ≤30 seconds. |
| E2E-AI-03 | P0 | `force30Seconds` produces 30 seconds within one frame. |
| E2E-AI-04 | P0 | Prompt injection in filename/transcript cannot change policy, expose secret, or fabricate tool use. |
| E2E-AI-05 | P0 | Invalid model JSON gets one bounded repair then safe failure; no partial creative version. |
| E2E-AI-06 | P1 | No trend/provider uses evergreen fallback and explains reduced confidence. |
| E2E-AI-07 | P0 | Regeneration preserves locked fields and creates immutable child version. |
| E2E-AI-08 | P1 | Daily AI budget exhaustion preserves manual/project access and shows recovery time. |

## Storyboard and rendering

| ID | Pri | Scenario / expected result |
|---|---:|---|
| E2E-REN-01 | P0 | Trim/reorder/replace/caption/transition edit saves, previews, refreshes and remains version-consistent. |
| E2E-REN-02 | P0 | Mixed photo/portrait/landscape project renders valid preview and 1080×1920 master. |
| E2E-REN-03 | P0 | Duplicate render request reuses one logical artifact/quota reservation. |
| E2E-REN-04 | P0 | Cancel kills FFmpeg, removes partial output, releases quota and reaches canceled. |
| E2E-REN-05 | P0 | Worker death expires lease and retries without duplicate ready master. |
| E2E-REN-06 | P0 | Bad codec/caption bounds/loudness/black output fails QC and cannot publish. |
| E2E-REN-07 | P1 | Every catalogue transition/caption/audio mode matches golden fixture. |
| E2E-REN-08 | P0 | Shorts-library recommendation is not present in rendered audio. |

## YouTube

| ID | Pri | Scenario / expected result |
|---|---:|---|
| E2E-YT-01 | P0 | OAuth state/PKCE success connects intended channel; invalid/replayed state fails. |
| E2E-YT-02 | P0 | Revoked/expired token requests reauthorization without exposing tokens. |
| E2E-YT-03 | P0 | Approval-required policy blocks editor/unapproved publication. |
| E2E-YT-04 | P0 | Private/unlisted test upload resumes after injected failure and creates one remote video. |
| E2E-YT-05 | P0 | Ambiguous timeout reconciles before retry; no duplicate platform video. |
| E2E-YT-06 | P1 | 429/quota/processing failure shows correct retry and safe provider detail. |
| E2E-YT-07 | P0 | Option 1 displays track/cue/volume/checklist and accurately records added/skipped/unavailable attestation. |
| E2E-YT-08 | P1 | Schedule displays creator timezone correctly across DST and reconciles remote state. |

## Analytics and learning

| ID | Pri | Scenario / expected result |
|---|---:|---|
| E2E-INS-01 | P0 | Published test video syncs append-only metrics with definition/window/freshness. |
| E2E-INS-02 | P0 | Unavailable metric remains null, not zero; late correction is traceable. |
| E2E-INS-03 | P1 | Dashboard filters, retention chart/table and baseline work accessibly on mobile/desktop. |
| E2E-INS-04 | P0 | Narrative claims link to evidence and do not infer causality from correlation. |
| E2E-LRN-01 | P0 | One publication cannot create an applicable DNA change. |
| E2E-LRN-02 | P0 | Locked DNA cannot change; valid multi-publication proposal requires human approval. |
| E2E-LRN-03 | P0 | Apply and revert are exact, audited, idempotent, and affect future context only. |

## Privacy, operations, and resilience

| ID | Pri | Scenario / expected result |
|---|---:|---|
| E2E-PRV-01 | P0 | Authorized export contains documented data, is encrypted/expiring, and is audited. |
| E2E-PRV-02 | P0 | Workspace deletion follows dependency order, respects hold, and produces evidence. |
| E2E-PRV-03 | P0 | Retention sweep cannot cross tenant or delete held/current data. |
| E2E-OPS-01 | P0 | Database/Redis/storage/provider outage produces correct readiness, circuit, retry and recovery. |
| E2E-OPS-02 | P0 | Backup restore meets RPO/RTO and reconciles queues/objects. |
| E2E-OPS-03 | P1 | Alert links to runbook and operator diagnoses injected failure without private media. |
| E2E-OPS-04 | P0 | Logs/traces/errors contain no secret, token, signed URL, raw transcript or host path. |
| E2E-OPS-05 | P0 | Server-authoritative quotas withstand concurrent requests and settle reservations. |
| E2E-REL-01 | P0 | Expand/contract migration supports mixed versions; rollback restores service. |

## UX and accessibility matrix

Run P0 journeys at 360×800 mobile and 1440×900 desktop; core screens also at 390, 768, 1024. Browser baseline: current and previous Chrome, Edge, Safari; Firefox current. Test keyboard-only, VoiceOver/NVDA representative paths, 200% zoom, reduced motion, high contrast, touch targets, offline/reconnect, slow network, loading/empty/error/conflict states.

Release requires all P0 passing, all sprint-relevant P1 passing, zero unresolved Critical/High security findings, and a signed exception for any deferred P2.
