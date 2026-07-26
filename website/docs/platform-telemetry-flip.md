# AstraJax Platform telemetry flip

Status: implementation branch. Matthew approves and merges; this document is the deployment handoff, not a deploy instruction.

## What changes

The website gains one shared platform-session contract across Ask Clive, Chapter 1, curation, Court, and voice:

- `/api/platform-sessions/start` creates the Household Activity Sessions row synchronously and returns a signed handle containing the public Session ID and Airtable record ID.
- A private Vercel Blob lease keeps `lastActivityAt`, state, and the authoritative event sequence. Every event reservation refreshes the lease.
- Unchosen exits pause. A sweeper closes sessions idle for more than 30 minutes as `timed_out`. Re-entry before expiry records `reopened`.
- `End session` is the explicit close and writes `closed_by_user`. The launcher’s `Close` button still only dismisses the panel.
- Chapter 1 `Start again` ends the platform session before clearing its local ledger.

Turns are normalized as one Turn per human exchange. Multi-call surfaces add child Model Call rows: Chapter 1 classification, curation rounds, and Court’s concurrent bench calls. TTS adds a Voice row. All surfaces use the route-neutral manifest shape:

```ts
{ kind, recordIds, urls, promptVersion, source }
```

Ordinary Turn rows keep the visitor message verbatim for prompt coaching. Reply Digest remains capped at 500 characters. The persistence boundary redacts obvious pasted credentials (provider keys, bearer tokens, PATs, JWTs, passwords, and private-key blocks) while leaving ordinary wording and non-secret Airtable IDs intact.

Retention, disclosure, Data Class, Retain Until, and Retention Hold are deliberately absent. Those return at the productisation gate.

## Durable write-behind

No model callback awaits Airtable.

1. The request writes a normalized envelope to a private Vercel Blob outbox.
2. Next.js `after()` schedules a flush after 650 ms; the scheduled worker is the durable backstop.
3. The worker locks with optimistic concurrency, partitions by base/table, deduplicates by Event ID, and creates batches of 10.
4. Airtable requests are spaced at 260 ms (under four requests per second).
5. Failures use exponential backoff from 30 seconds with jitter. The final failed attempt moves to the dead-letter prefix.
6. Queue age and dead-letter moves emit structured server errors for alerting.

The serving Airtable module exposes POST creates only. Reviewer PATCHes live in a separate module and require `HOUSEHOLD_ACTIVITY_REVIEW_TOKEN`. There is no Airtable delete path in this build.

## Environment

Copy names from `.env.example`; never commit values.

Required for sessions:

- `PLATFORM_SESSION_SECRET`
- `HOUSEHOLD_ACTIVITY_WRITE_TOKEN`
- `PLATFORM_SESSION_ENABLED=true`
- a private Vercel Blob store connected to the project (`BLOB_STORE_ID`; Vercel supplies the rotating OIDC token)

Required for event flushing and dual reads:

- `HOUSEHOLD_ACTIVITY_READ_TOKEN` (read-only; Event ID dedupe and review reads)
- `PLATFORM_MODEL_RATE_CARD_JSON`
- `PLATFORM_ACTIVITY_EVENT_WRITES_ENABLED=true`

Required for review writes:

- `HOUSEHOLD_ACTIVITY_REVIEW_TOKEN` (update access to Household Activity only)

Required for scheduled endpoints:

- `CRON_SECRET`

Rate-card shape:

```json
{
  "version": "YYYY-MM-DD",
  "models": {
    "provider-model-id": {
      "inputPerMillion": 0,
      "outputPerMillion": 0
    }
  }
}
```

Returned model IDs and exact provider usage feed the calculation. Rate Card Version is stored in Detail; calculated model-call cost uses Cost USD. Voice does not pretend TTS bytes are text tokens.

## Airtable choice handling

This build deliberately uses `typecast=true` on creates. The first successful platform write can materialize `Runtime = AstraJax Platform` and the new event/outcome choices without a separate schema-edit API. This is the chosen alternative to Matthew adding the Runtime option manually in the Airtable UI. If the token owner lacks Creator permission to extend a single-select choice, add `AstraJax Platform` manually before enabling the feature flag.

Target remains:

- Household Activity base `appF7jQD4ZKrDC7e1`
- Sessions `tblUi4nmBKX2u8nFx`
- Activity `tblNxNLyC31KDQbRl`

## Reader cutover

Defaults are intentionally dark:

```text
INTERACTION_READ_MODE=brain_only
INTERACTION_WRITE_TARGET=brain_interactions
```

Cut over in this order:

1. Configure secrets, Blob, and cron while both platform flags remain false.
2. Enable `PLATFORM_SESSION_ENABLED` and verify start/pause/reopen/end/timed-out rows.
3. Set `INTERACTION_READ_MODE=dual`; confirm the review shell and curation docket show source-labelled records.
4. Add the approved rate card.
5. In one deployment, set `PLATFORM_ACTIVITY_EVENT_WRITES_ENABLED=true` and `INTERACTION_WRITE_TARGET=household_activity`. This avoids dual-writing new interactions.
6. Verify Turn/Model Call/Voice rows, Event ID dedupe, Agent Quality/Human Quality routing, queue age, and dead letters.
7. Move to `INTERACTION_READ_MODE=household_only` only when the historical Brain Interactions view is no longer needed operationally.

The review form maps agent-answer scoring to Agent Quality. Human-prompt scoring is offered only on Household Activity rows and writes Human Quality. Agent Quality alone drives low-answer context upkeep.

## Schedules Matthew configures

No schedule is committed because deployment cadence and Vercel project ownership are external configuration.

- Call `GET /api/platform-activity/worker` every minute.
- Call `GET /api/platform-sessions/sweep` every five minutes.
- Both requests must carry `Authorization: Bearer $CRON_SECRET` (Vercel Cron does this when `CRON_SECRET` is configured).

## Verification

Before merge:

```text
npm ci
npm run test:brain-key
npm run test:platform-activity
npm run build
```

Manual checks:

- streamed and non-stream Ask Clive produce one Turn, never two;
- Chapter 1’s final interview exchange has one Turn plus intake and classifier Model Calls;
- curation produces one Turn plus one child per model round;
- Court convene produces one Turn plus one child per attendant, while automatic bicker adds children rather than fake human turns;
- voice produces a Voice child and no text-token fiction;
- panel Close dismisses only; Pause is non-terminal; End session is terminal;
- tab close/back/offline pause without a blocking modal;
- a return before lease expiry records reopened; the sweeper records timed_out after expiry;
- Start again closes before the Chapter 1 ledger is cleared;
- a pasted test credential is redacted in User Message while the surrounding prompt remains faithful.

No public claims or marketing copy change in this branch.
