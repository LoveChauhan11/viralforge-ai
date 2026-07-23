# Trend and Music Intelligence

## Objective

Recommend relevant creative patterns without claiming certainty or depending on brittle scraping. A trend is a time-bounded hypothesis composed of multiple signals.

## Signal sources

Use official YouTube Data and Analytics APIs for the connected creator. Add public, permitted discovery sources and curated/manual inputs behind source adapters. Record source, observation time, region, language, niche, sampling method, and confidence.

Do not scrape authenticated YouTube pages, defeat rate limits, or pretend globally popular videos are relevant to every niche.

## Trend pipeline

1. Collect observations on a schedule.
2. Normalize titles, topics, duration, publication time, engagement ratios, and available audio references.
3. Remove duplicates and low-quality/spam observations.
4. Cluster by semantic topic and creative pattern.
5. Detect velocity relative to the source's prior window.
6. Score relevance to Creator DNA and available assets.
7. Generate a trend snapshot with expiry.
8. Present evidence and confidence to the user.
9. Record whether the recommendation was selected and its eventual outcome.

## Scoring

Trend opportunity score is a transparent weighted function of freshness, velocity, niche relevance, regional/language fit, asset feasibility, creator fit, and evidence quality. Store component scores. Avoid one universal “viral score.”

## Pattern vocabulary

Normalize patterns separately:

- Hook: surprise, question, transformation, challenge, reveal, POV.
- Story: before/after, escalation, list, micro-tutorial, reaction, payoff.
- Pacing: median shot length, early cut density, pause placement.
- Transition: cut, motion match, whip, cover reveal, zoom, crossfade.
- Caption: density, placement, emphasis rhythm.
- Audio: track reference, energy curve, beat positions, usage mode.

## Music: approved Option 1

The YouTube Shorts library cannot be attached through the public upload API.

For a platform-library recommendation:

1. Store track name, artist, platform reference, suggested segment, beat markers where available, and confidence.
2. Create the edit against a beat map without embedding the protected track.
3. Render with original audio only or silence.
4. Upload according to the user's selected visibility.
5. Show the user the exact YouTube-app handoff.
6. User adds the library track in YouTube and confirms.
7. Track publication state separately from music-confirmation state.

For original or licensed audio, require an explicit rights mode and evidence/reference, then the media pipeline may mix it automatically.

## Freshness and fallback

Snapshots have an expiry based on signal volatility. If collection fails, show the snapshot age and lower confidence. If no trustworthy trend exists, use Creator DNA and proven evergreen structures. Missing trend data must never block creation.

## Compliance and cost

Respect API quotas, attribution rules, retention limits, and user deletion. Cache shared non-personal snapshots. Keep connected-channel analytics private to its workspace. Add per-source kill switches and quota budgets.
