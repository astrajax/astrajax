// @ts-nocheck
/**
 * Airtable interface button -> Hyperagent Clive Curator webhook.
 *
 * Setup: hyperagent/docs/clive-curator-webhook-setup.md
 *
 * Trigger: When interface button clicked
 * Action: Run script (this file)
 *
 * Input variables:
 *   webhookUrl  — Hyperagent Curator /receive URL (required)
 *   target      — daily | clive-core | agent-factory | curator | hyperagent-platform | ...
 *   checks      — e.g. stale,conflicts,duplicates,unsupported,risky
 *   mode        — curator-audit (default) | curator-cleanup-draft
 *   findingId   — for cleanup mode only
 *   requestedBy — optional, e.g. Matthew
 *
 * Secret (Secrets tab, not input variables):
 *   HYPERAGENT_WEBHOOK_SECRET
 */

const cfg = input.config();

function pickStr(obj, keys, fallback = '') {
    for (const key of keys) {
        const value = obj[key];
        if (value != null && String(value).trim() !== '') return String(value).trim();
    }
    return fallback;
}

function readSecret() {
    const names = ['HYPERAGENT_WEBHOOK_SECRET', 'CLIVE_CURATOR_WEBHOOK_SECRET'];
    if (input.secret && typeof input.secret === 'function') {
        for (const name of names) {
            try {
                const value = input.secret(name);
                if (value != null && String(value).trim() !== '') {
                    return { secret: String(value).trim(), source: `secrets:${name}` };
                }
            } catch (_) {
                // Secret not linked in this automation.
            }
        }
    }
    const fromInput = pickStr(cfg, ['webhookSecret', 'hyperagentWebhookSecret']);
    if (fromInput) return { secret: fromInput, source: 'input-variable' };
    return { secret: '', source: 'none' };
}

const webhookUrl = pickStr(cfg, ['webhookUrl', 'hyperagentWebhookUrl']);
if (!webhookUrl) {
    throw new Error('Missing webhookUrl input variable. See hyperagent/docs/clive-curator-webhook-setup.md');
}

const mode = pickStr(cfg, ['mode'], 'curator-audit');
const target = pickStr(cfg, ['target'], 'daily');
const checks = pickStr(cfg, ['checks'], 'stale,conflicts,duplicates,unsupported,risky');
const requestedBy = pickStr(cfg, ['requestedBy'], 'Airtable interface button');
const findingId = pickStr(cfg, ['findingId', 'finding']);

const payload = {
    mode,
    target,
    checks,
    requestedBy,
    source: 'airtable-interface-button',
    requestedAt: new Date().toISOString(),
    message: `Curator ${mode} requested for target=${target}`,
};

if (mode === 'curator-cleanup-draft' && findingId) {
    payload.findingId = findingId;
    payload.message = `Curator cleanup draft for finding ${findingId}`;
}

const secretInfo = readSecret();
if (!secretInfo.secret) {
    throw new Error(
        'HYPERAGENT_WEBHOOK_SECRET not set. Add it on the Run script Secrets tab (not in script source).',
    );
}

const headers = {
    'Content-Type': 'application/json',
    'X-Hyperagent-Webhook-Secret': secretInfo.secret,
};

const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
});

let bodyText = '';
try {
    bodyText = await response.text();
} catch (_) {
    bodyText = '';
}

let runId = null;
if (bodyText) {
    try {
        const parsed = JSON.parse(bodyText);
        if (parsed && typeof parsed.runId === 'string') runId = parsed.runId;
    } catch (_) {
        // Not JSON
    }
}

const ok = response.status >= 200 && response.status < 300;
if (!ok) {
    if (response.status === 403 && /invalid webhook secret/i.test(bodyText)) {
        throw new Error(
            'Hyperagent HTTP 403: Invalid webhook secret. Re-copy from Hyperagent Curator webhook '
            + 'and set HYPERAGENT_WEBHOOK_SECRET on Secrets tab only.',
        );
    }
    throw new Error(`Hyperagent curator webhook HTTP ${response.status}: ${bodyText.slice(0, 300)}`);
}

output.set('webhookOk', true);
output.set('webhookStatus', response.status);
output.set('webhookRunId', runId);
output.set('secretSource', secretInfo.source);
output.set('mode', mode);
output.set('target', target);
output.set('checks', checks);
output.set('response', bodyText.slice(0, 500));
