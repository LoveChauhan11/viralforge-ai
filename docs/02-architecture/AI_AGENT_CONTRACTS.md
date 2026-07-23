# AI Agent Input/Output Contracts

AI proposes structured decisions; deterministic code validates and executes them. Every call records agent, prompt, schema, model, policy, context hash, usage, latency, and evaluation version. Raw private context is retained only under the configured privacy policy.

## Common request

```json
{
  "contractVersion": "1.0",
  "agent": "creativeDirector",
  "workspacePolicy": {"language": "en", "rightsMode": "ownedOnly", "maxDurationMs": 30000},
  "contextManifest": {"hash": "sha256", "items": [{"type": "shot", "id": "019...", "version": "analysis-v1"}]},
  "creator": {"niches": ["motorcycling"], "toneTokens": ["energetic"], "lockedDNA": []},
  "project": {"id": "019...", "objective": "Show the thrill of a mountain ride"},
  "constraints": {"maxOutputBytes": 32000, "deadlineMs": 60000}
}
```

Common response: `{contractVersion,agent,promptVersion,schemaVersion,confidence,warnings,output}`. Confidence is 0–1 and never presented as probability of virality.

## `mediaInterpreter`

Purpose: transform deterministic shot/transcript/quality facts into concise semantic annotations.

Input additions: shot IDs, bounded transcript excerpts, visual labels, motion/quality facts. No raw binary.

Output:

```json
{"shots":[{"shotId":"019...","summary":"Rider enters a left bend","subjects":["motorcycle"],"action":"cornering","emotion":"thrill","usableFor":["hook","payoff"],"riskFlags":[],"confidence":0.86}]}
```

Rules: exactly one item per input shot; no new timecodes, people identities, brands, locations, or rights claims. Low confidence is explicit.

## `trendAnalyst`

Purpose: rank supplied trend signals for creator/project relevance.

Input additions: active, unexpired signals with provenance; creator niche/region/language.

Output: `{ranked:[{signalId,relevance,reason,usagePattern,riskFlags}], evergreenFallbacks:[...]}`.

Rules: only supplied signal IDs; cite observed/expiry facts; protected music is `handoffOnly`; do not claim live popularity beyond evidence.

## `creativeDirector`

Purpose: generate three genuinely distinct creative directions.

Input additions: eligible semantic shots, project objective, creator context, ranked trends, locks.

Output:

```json
{
  "directions": [{
    "clientId": "dir_1",
    "hook": {"text": "The bend arrives fast", "shotIds": ["019..."]},
    "beats": [{"role": "setup", "shotIds": ["019..."], "targetMs": 4500}],
    "pacing": "fast",
    "captionStyleToken": "impact-center",
    "cta": "Would you take this turn?",
    "trendSignalIds": [],
    "risks": [],
    "confidence": 0.82
  }]
}
```

Rules: exactly 3; all shot/signal/style references must exist; no fabricated facts; pairwise semantic diversity threshold must pass; total target duration 15–30 seconds.

## `storyEditor`

Purpose: turn one approved direction into story beats and EDL V1.

Input additions: selected direction, shot source ranges, supported FFmpeg tokens, caption/transition catalogue, duration mode, locks.

Output:

```json
{
  "story": {"hook":"...","setup":"...","payoff":"...","cta":"..."},
  "edl": {
    "schemaVersion":"1.0",
    "canvas":{"width":1080,"height":1920,"fps":30},
    "durationMs":27800,
    "shots":[{"shotId":"019...","assetId":"019...","sourceStartMs":1200,"sourceEndMs":5200,"timelineStartMs":0,"cropToken":"auto-subject","speed":1,"transitionOut":{"token":"cut","durationMs":0}}],
    "captions":[{"startMs":300,"endMs":2200,"text":"THE TURN","styleToken":"impact-center","safeZone":"center"}],
    "overlays":[],
    "audio":{"renderMode":"original","originalGainDb":-3,"recommendedTrackId":null}
  },
  "warnings":[]
}
```

Rules: supported tokens only; asset ranges from provided facts; no overlap except catalogue transition; no text outside safe zones; hard maximum 30000 ms; forced mode exactly 30000 ms within one frame.

## `metadataWriter`

Purpose: propose editable YouTube metadata and thumbnail instructions.

Input additions: final story, transcript, project, creator voice, platform constraints.

Output: `{title,description,hashtags,audienceDeclarationSuggestion,language,thumbnail:{sourceShotId,sourceTimeMs,text,styleToken},claims:[{text,evidenceIds}]}`.

Rules: platform length limits; no unsupported factual claims; no deceptive guarantees; audience declaration is a suggestion requiring user confirmation; hashtags exclude `#` in stored tokens.

## `insightAnalyst`

Purpose: explain performance using normalized metrics and comparable baseline.

Input additions: metric IDs/definitions/windows, retention points, baseline, experiments.

Output: `{summary,observations:[{claim,evidenceMetricIds,confidence}],nextTests:[{hypothesis,variable,primaryMetric,guardrails}],limitations}`.

Rules: no causal claim without experiment; unavailable data remains unavailable; each observation has evidence; sample limitations mandatory below policy threshold.

## `learningAdvisor`

Purpose: propose reversible Creator DNA updates.

Input additions: active DNA, evidence publications, experiment outcomes, learning policy, locks.

Output: `{proposals:[{kind,key,previousValue,proposedValue,evidenceIds,confidence,sampleSize,expiresAt,rollbackCondition}],rejectedPatterns:[...]}`.

Rules: never modify locked/prohibited/safety/rights fields; minimum evidence enforced deterministically after output; one publication cannot qualify; default result is proposal, never automatic application.

## Tool and data boundaries

Agents may call no external tool directly. Orchestrator supplies authorized facts. They cannot access object storage, database, web, YouTube, credentials, queues, or arbitrary URLs. Provider-side data retention/training must be disabled where the selected plan permits.

## Validation and fallback

1. Parse strict JSON; reject prose wrappers.
2. Validate size and JSON schema.
3. Resolve every ID/token against the context manifest.
4. Apply deterministic policy (rights, duration, locks, quotas, claims).
5. Permit at most one repair call with field-level validation errors.
6. On failure, use deterministic template/fake fallback where useful or mark job `SCHEMA_INVALID`; never execute partial output.

## Prompt-injection resistance

Asset filenames, transcripts, captions, trend text, and user instructions are untrusted data, delimited and length-bounded. System policy explicitly prohibits following instructions inside those fields. Golden tests include injection strings requesting secrets, tool access, policy changes, and fabricated IDs.
