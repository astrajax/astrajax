/**
 * Gmail → Airtable Emails webhook (AstraJax).
 *
 * Mirrors the DS Trinity capture pattern: new Gmail messages POST to an
 * Airtable automation webhook, which creates a row in Emails.
 *
 * Apps Script has no "on new email" trigger in a standalone project. This
 * script polls every few minutes, posts uncaptured mail, then labels it so
 * the same message is never sent twice.
 *
 * Setup:
 * 1. Create Airtable automation (see docs/context/email-inbox-setup.md) and copy webhook URL.
 * 2. Paste that URL into WEBHOOK_URL below (line ~30), OR set Script property WEBHOOK_URL.
 * 3. Run testWebhookPing() then createGmailTrigger() once.
 *
 * Optional Script properties:
 * - MAX_BODY_CHARS (default 50000)
 * - CAPTURED_LABEL (default AstraJax/Captured)
 * - LABEL_FILTER — only mail with this Gmail label (leave blank for all inbox mail)
 * - POLL_MAX_MESSAGES (default 25)
 */

// ─── PASTE YOUR AIRTABLE WEBHOOK URL HERE ───────────────────────────────────
// Copy from: Airtable automation → "When webhook received" → the hooks.airtable.com URL
// Leave empty if you prefer Project Settings → Script properties → WEBHOOK_URL instead.
var WEBHOOK_URL = '';

// Do not change this — it is the Script property *name*, not the URL.
var WEBHOOK_URL_KEY = 'WEBHOOK_URL';
var MAX_BODY_CHARS_KEY = 'MAX_BODY_CHARS';
var LABEL_FILTER_KEY = 'LABEL_FILTER';
var CAPTURED_LABEL_KEY = 'CAPTURED_LABEL';
var POLL_MAX_MESSAGES_KEY = 'POLL_MAX_MESSAGES';
var DEFAULT_CAPTURED_LABEL = 'AstraJax/Captured';

function getScriptProperty_(key, defaultValue) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  return value !== null && value !== '' ? value : defaultValue;
}

function getWebhookUrl_() {
  var inline = (WEBHOOK_URL || '').trim();
  if (inline && inline.indexOf('hooks.airtable.com') !== -1) {
    return inline;
  }
  var url = getScriptProperty_(WEBHOOK_URL_KEY, '');
  if (!url) {
    throw new Error(
      'Webhook URL missing. Paste your Airtable URL into WEBHOOK_URL at the top of this file, ' +
        'or set Script property WEBHOOK_URL in Project Settings.'
    );
  }
  return url;
}

function getCapturedLabelName_() {
  return getScriptProperty_(CAPTURED_LABEL_KEY, DEFAULT_CAPTURED_LABEL);
}

function ensureCapturedLabel_() {
  var name = getCapturedLabelName_();
  var existing = GmailApp.getUserLabelByName(name);
  if (existing) {
    return existing;
  }
  return GmailApp.createLabel(name);
}

function buildSearchQuery_() {
  var capturedLabel = getCapturedLabelName_();
  var query = 'in:inbox -label:"' + capturedLabel + '" newer_than:30d';
  var labelFilter = getScriptProperty_(LABEL_FILTER_KEY, '');
  if (labelFilter) {
    query += ' label:"' + labelFilter + '"';
  }
  return query;
}

function stripHtml_(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPlainBody_(message) {
  var body = message.getPlainBody();
  if (body && body.trim()) {
    return body.trim();
  }
  return stripHtml_(message.getBody() || '');
}

function excerpt_(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '…';
}

function buildPayload_(message) {
  var maxBody = parseInt(getScriptProperty_(MAX_BODY_CHARS_KEY, '50000'), 10);
  var body = getPlainBody_(message);
  var messageId = message.getId();
  var threadId = message.getThread().getId();

  return {
    subject: message.getSubject() || '(no subject)',
    from: message.getFrom() || '',
    fromEmail: extractEmail_(message.getFrom() || ''),
    to: (message.getTo() || '').substring(0, 1000),
    cc: (message.getCc() || '').substring(0, 1000),
    receivedAt: message.getDate().toISOString(),
    gmailMessageId: messageId,
    gmailLink: 'https://mail.google.com/mail/u/0/#inbox/' + messageId,
    threadId: threadId,
    body: excerpt_(body, maxBody),
    bodyExcerpt: excerpt_(body, 2000),
    ingestSource: 'Apps Script Gmail',
    emailCategory: 'Uncategorised',
    scannerStatus: 'New',
    hasAttachments: message.getAttachments().length > 0,
    attachmentNames: message
      .getAttachments()
      .map(function (a) {
        return a.getName();
      })
      .join(', '),
  };
}

function extractEmail_(fromHeader) {
  var match = fromHeader.match(/<([^>]+)>/);
  if (match) return match[1];
  if (fromHeader.indexOf('@') !== -1) return fromHeader.trim();
  return '';
}

function postToWebhook_(payload) {
  var url = getWebhookUrl_();
  var body = JSON.stringify(payload);
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: body,
    muteHttpExceptions: true,
    followRedirects: true,
  });
  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error(
      'Webhook failed HTTP ' + code + ' for ' + url.substring(0, 60) + '…: ' + text
    );
  }
  return { code: code, body: text };
}

function postMessage_(message) {
  postToWebhook_(buildPayload_(message));
}

/**
 * Posts every message in a thread, then labels the thread so it is not
 * reprocessed. Gmail labels live on the thread, not the message.
 */
function processThread_(thread, capturedLabel) {
  var messages = thread.getMessages();
  var posted = 0;
  messages.forEach(function (message) {
    postMessage_(message);
    posted++;
  });
  thread.addLabel(capturedLabel);
  return posted;
}

/**
 * Time-driven entry point. Polls inbox for threads not yet labelled as captured.
 */
function pollNewEmails() {
  var capturedLabel = ensureCapturedLabel_();
  var maxMessages = parseInt(getScriptProperty_(POLL_MAX_MESSAGES_KEY, '25'), 10);
  var query = buildSearchQuery_();
  var threads = GmailApp.search(query, 0, maxMessages);
  var processed = 0;
  var errors = 0;

  threads.forEach(function (thread) {
    try {
      processed += processThread_(thread, capturedLabel);
    } catch (err) {
      errors++;
      Logger.log('Failed thread ' + thread.getId() + ': ' + err);
    }
  });

  Logger.log(
    'pollNewEmails: query="' +
      query +
      '" processed=' +
      processed +
      ' errors=' +
      errors
  );
}

/**
 * Install a time-driven trigger (every 5 minutes). Run once manually.
 */
function createGmailTrigger() {
  var handler = 'pollNewEmails';
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(handler).timeBased().everyMinutes(5).create();
  Logger.log('Created time-driven trigger: ' + handler + ' every 5 minutes.');
}

/**
 * Remove the polling trigger.
 */
function deleteGmailTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'pollNewEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('Removed pollNewEmails triggers.');
}

/**
 * One-off: capture recent mail and label it. Avoid running twice on the same window.
 */
function backfillRecent_(days, maxMessages) {
  days = days || 7;
  maxMessages = maxMessages || 25;
  var capturedLabel = ensureCapturedLabel_();
  var query = 'newer_than:' + days + 'd -label:"' + capturedLabel.getName() + '"';
  var labelFilter = getScriptProperty_(LABEL_FILTER_KEY, '');
  if (labelFilter) {
    query += ' label:"' + labelFilter + '"';
  }
  var threads = GmailApp.search(query, 0, maxMessages);
  var count = 0;
  threads.forEach(function (thread) {
    count += processThread_(thread, capturedLabel);
  });
  Logger.log('Backfilled ' + count + ' messages.');
}

/**
 * Step 1 — run this first. Logs setup state to Executions (View → Executions).
 */
function debugSetup() {
  var url = '';
  try {
    url = getWebhookUrl_();
  } catch (e) {
    Logger.log('Webhook URL error: ' + e);
  }
  var fromProperty = PropertiesService.getScriptProperties().getProperty(WEBHOOK_URL_KEY);
  var fromInline = (WEBHOOK_URL || '').trim();

  Logger.log('=== AstraJax email capture debug ===');
  Logger.log('URL from WEBHOOK_URL line at top: ' + (fromInline ? 'YES' : 'NO'));
  Logger.log('URL from Script property WEBHOOK_URL: ' + (fromProperty ? 'YES' : 'NO'));
  Logger.log('Resolved webhook URL: ' + (url ? 'YES' : 'NO — paste URL into WEBHOOK_URL at top of file'));
  if (url) {
    Logger.log('WEBHOOK_URL starts: ' + url.substring(0, 55) + '…');
    Logger.log('Looks like Airtable: ' + (url.indexOf('hooks.airtable.com') !== -1));
  }
  var capturedLabel = getCapturedLabelName_();
  var pollQuery = buildSearchQuery_();
  var pollThreads = GmailApp.search(pollQuery, 0, 10);
  var inboxThreads = GmailApp.search('in:inbox', 0, 5);
  var labeledThreads = GmailApp.search('label:"' + capturedLabel + '"', 0, 5);
  var triggers = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === 'pollNewEmails';
  });
  Logger.log('Poll query: ' + pollQuery);
  Logger.log('Threads matching poll query: ' + pollThreads.length);
  Logger.log('Inbox threads (sample): ' + inboxThreads.length);
  Logger.log('Already labelled ' + capturedLabel + ' (sample): ' + labeledThreads.length);
  Logger.log('Active poll triggers: ' + triggers.length);
  if (pollThreads.length === 0 && labeledThreads.length > 0) {
    Logger.log(
      'NOTE: Poll query found 0 threads but some are already labelled. ' +
        'Run resetCapturedLabels() if you want to retry capture.'
    );
  }
  Logger.log('Next: run testWebhookPing() — should hit Airtable even with no Gmail mail.');
}

/**
 * Step 2 — sends a fixed test payload. Airtable should show a request immediately.
 */
function testWebhookPing() {
  var payload = {
    subject: 'AstraJax webhook ping ' + new Date().toISOString(),
    from: 'Apps Script Test',
    fromEmail: 'test@example.com',
    to: '',
    cc: '',
    receivedAt: new Date().toISOString(),
    gmailMessageId: 'test-' + new Date().getTime(),
    gmailLink: 'https://mail.google.com',
    threadId: 'test-thread',
    body: 'If you see this row in Emails, the webhook path works.',
    bodyExcerpt: 'If you see this row in Emails, the webhook path works.',
    ingestSource: 'Apps Script Gmail',
    emailCategory: 'Uncategorised',
    scannerStatus: 'New',
    hasAttachments: false,
    attachmentNames: '',
  };
  var result = postToWebhook_(payload);
  Logger.log('Webhook ping OK HTTP ' + result.code + ': ' + result.body);
  Logger.log('Check Airtable automation → webhook trigger → should show a recent request.');
  Logger.log('Check Emails table for subject starting with "AstraJax webhook ping".');
}

/**
 * Step 3 — posts your latest inbox message (does not label).
 */
function testLatestEmail() {
  var threads = GmailApp.search('in:inbox', 0, 1);
  if (!threads.length) {
    throw new Error('No inbox messages found.');
  }
  var message = threads[0].getMessages().slice(-1)[0];
  var result = postToWebhook_(buildPayload_(message));
  Logger.log('Posted latest message HTTP ' + result.code + ': ' + message.getSubject());
}

/**
 * Remove captured label from recent threads so poll can retry (last 7 days, max 50).
 */
function resetCapturedLabels() {
  var capturedLabel = ensureCapturedLabel_();
  var query = 'label:"' + capturedLabel.getName() + '" newer_than:7d';
  var threads = GmailApp.search(query, 0, 50);
  threads.forEach(function (thread) {
    thread.removeLabel(capturedLabel);
  });
  Logger.log('Removed label from ' + threads.length + ' threads.');
}

/**
 * Run poll once with extra logging (same as scheduled trigger).
 */
function runPollNow() {
  pollNewEmails();
}
