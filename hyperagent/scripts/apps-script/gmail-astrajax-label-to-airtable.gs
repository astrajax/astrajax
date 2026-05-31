/**
 * Gmail → Airtable Emails when YOU apply the AstraJax label (AstraJax).
 *
 * How it works:
 * 1. You apply Gmail label "AstraJax" to any email (manual curation).
 * 2. This script polls every minute for labelled threads not yet sent.
 * 3. It POSTs to the same Airtable webhook → row in Emails.
 * 4. It adds label "AstraJax/Sent" so the same thread is never sent twice.
 *
 * Apps Script cannot fire instantly when you add a label — expect ~1 minute delay.
 *
 * Setup:
 * 1. Use the SAME Airtable webhook URL as the inbox capture script.
 * 2. Paste URL into WEBHOOK_URL below.
 * 3. Run setupAstraJaxLabels() once (creates AstraJax + AstraJax/Sent in Gmail).
 * 4. Run testWebhookPing() then createLabelTrigger() once.
 *
 * Tip: use a SEPARATE Apps Script project from the all-inbox script so triggers
 * do not clash.
 */

// ─── PASTE YOUR AIRTABLE WEBHOOK URL HERE ───────────────────────────────────
var WEBHOOK_URL = '';

var WEBHOOK_URL_KEY = 'WEBHOOK_URL';
var MAX_BODY_CHARS_KEY = 'MAX_BODY_CHARS';
var POLL_MAX_MESSAGES_KEY = 'POLL_MAX_MESSAGES';

// Label YOU apply in Gmail when you want an email in Airtable
var ASTRAJAX_LABEL = 'AstraJax';
// Label this script adds after a successful send (do not apply manually)
var SENT_LABEL = 'AstraJax/Sent';

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
      'Webhook URL missing. Paste your Airtable URL into WEBHOOK_URL at the top of this file.'
    );
  }
  return url;
}

function ensureLabel_(name) {
  var existing = GmailApp.getUserLabelByName(name);
  if (existing) {
    return existing;
  }
  return GmailApp.createLabel(name);
}

/**
 * Creates AstraJax and AstraJax/Sent labels in Gmail. Run once.
 */
function setupAstraJaxLabels() {
  ensureLabel_(ASTRAJAX_LABEL);
  ensureLabel_(SENT_LABEL);
  Logger.log('Labels ready: "' + ASTRAJAX_LABEL + '" (you apply) and "' + SENT_LABEL + '" (auto).');
}

function buildLabelSearchQuery_() {
  return 'label:"' + ASTRAJAX_LABEL + '" -label:"' + SENT_LABEL + '"';
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
    ingestSource: 'Apps Script Gmail (AstraJax label)',
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
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    followRedirects: true,
  });
  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Webhook failed HTTP ' + code + ': ' + text);
  }
  return { code: code, body: text };
}

function processLabelledThread_(thread, sentLabel) {
  var messages = thread.getMessages();
  var posted = 0;
  messages.forEach(function (message) {
    postToWebhook_(buildPayload_(message));
    posted++;
  });
  thread.addLabel(sentLabel);
  return posted;
}

/**
 * Poll entry point — runs every minute via createLabelTrigger().
 */
function pollLabelledEmails() {
  var sentLabel = ensureLabel_(SENT_LABEL);
  ensureLabel_(ASTRAJAX_LABEL);
  var maxThreads = parseInt(getScriptProperty_(POLL_MAX_MESSAGES_KEY, '25'), 10);
  var query = buildLabelSearchQuery_();
  var threads = GmailApp.search(query, 0, maxThreads);
  var posted = 0;
  var errors = 0;

  threads.forEach(function (thread) {
    try {
      posted += processLabelledThread_(thread, sentLabel);
    } catch (err) {
      errors++;
      Logger.log('Failed thread ' + thread.getId() + ': ' + err);
    }
  });

  Logger.log(
    'pollLabelledEmails: query="' + query + '" threads=' + threads.length +
      ' messages_posted=' + posted + ' errors=' + errors
  );
}

/**
 * Install 1-minute poll trigger. Run once after authorisation.
 */
function createLabelTrigger() {
  var handler = 'pollLabelledEmails';
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger(handler).timeBased().everyMinutes(1).create();
  Logger.log('Created 1-minute trigger for ' + handler);
}

function deleteLabelTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'pollLabelledEmails') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('Removed pollLabelledEmails triggers.');
}

function runPollNow() {
  pollLabelledEmails();
}

function testWebhookPing() {
  var payload = {
    subject: 'AstraJax label webhook ping ' + new Date().toISOString(),
    from: 'Apps Script Label Test',
    fromEmail: 'test@example.com',
    to: '',
    cc: '',
    receivedAt: new Date().toISOString(),
    gmailMessageId: 'label-test-' + new Date().getTime(),
    gmailLink: 'https://mail.google.com',
    threadId: 'label-test-thread',
    body: 'Label capture script — webhook test.',
    bodyExcerpt: 'Label capture script — webhook test.',
    ingestSource: 'Apps Script Gmail (AstraJax label)',
    emailCategory: 'Uncategorised',
    scannerStatus: 'New',
    hasAttachments: false,
    attachmentNames: '',
  };
  var result = postToWebhook_(payload);
  Logger.log('Ping OK HTTP ' + result.code);
}

function debugLabelSetup() {
  var url = '';
  try {
    url = getWebhookUrl_();
  } catch (e) {
    Logger.log('Webhook: ' + e);
  }
  var query = buildLabelSearchQuery_();
  var waiting = GmailApp.search(query, 0, 10);
  Logger.log('=== AstraJax label capture ===');
  Logger.log('Webhook configured: ' + (url ? 'YES' : 'NO'));
  Logger.log('You apply label: ' + ASTRAJAX_LABEL);
  Logger.log('Auto label after send: ' + SENT_LABEL);
  Logger.log('Waiting to send (sample): ' + waiting.length);
  Logger.log('Search: ' + query);
  Logger.log('Apply "' + ASTRAJAX_LABEL + '" to an email in Gmail, wait ~1 min, or run runPollNow().');
}

/**
 * Remove AstraJax/Sent from recent threads so you can resend (last 7 days, max 50).
 */
function resetSentLabels() {
  var sentLabel = ensureLabel_(SENT_LABEL);
  var threads = GmailApp.search('label:"' + SENT_LABEL + '" newer_than:7d', 0, 50);
  threads.forEach(function (thread) {
    thread.removeLabel(sentLabel);
  });
  Logger.log('Removed ' + SENT_LABEL + ' from ' + threads.length + ' threads.');
}
