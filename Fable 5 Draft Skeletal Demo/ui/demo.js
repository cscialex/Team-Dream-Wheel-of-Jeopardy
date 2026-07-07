/*
 * SS-01 UI — SKELETAL increment comms console.
 *
 * Demo harness only (not a game screen). Sends SRS §6.1 messages to the
 * Game Logic server over HTTP POST and receives §6.2 replies over
 * Server-Sent Events. Message names/payloads come from /shared/messages.js
 * (UI_TO_GL, GL_TO_UI, EXAMPLES are top-level consts from that script).
 */
'use strict';

const typeSelect = document.getElementById('message-type');
const payloadBox = document.getElementById('message-payload');
const logBox = document.getElementById('message-log');
const statusLine = document.getElementById('connection-status');
const repoRows = document.getElementById('repo-rows');

/* ---- Live message log ---------------------------------------------- */
const DIRECTION_CLASSES = {
  'UI→GL': 'direction-out',
  'GL→UI': 'direction-in',
  'GL→Repo': 'direction-repo-out',
  'Repo→GL': 'direction-repo-in',
};

function logMessage(direction, type, payload) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const dirClass = DIRECTION_CLASSES[direction] ?? 'direction-in';
  const time = new Date().toLocaleTimeString();
  entry.innerHTML =
    `<span class="timestamp">[${time}]</span> ` +
    `<span class="${dirClass}">${direction}</span> ` +
    `<span class="msg-type">${type}</span> ${JSON.stringify(payload)}`;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
}

/* ---- GL→UI channel: Server-Sent Events ------------------------------ */
const events = new EventSource('/api/events');

events.onopen = () => {
  statusLine.textContent = 'Connected to Game Logic (SS-02) — GL→UI event stream open.';
  statusLine.className = 'status connected';
};
events.onerror = () => {
  statusLine.textContent = 'Disconnected from Game Logic — is the server running? (node game-logic/server.js)';
  statusLine.className = 'status disconnected';
};
events.onmessage = (evt) => {
  const message = JSON.parse(evt.data);
  logMessage(message.direction ?? 'GL→UI', message.type, message.payload);
  if (message.type === 'REPO_READ_RESULT') renderRepoRows(message.payload);
  if (message.type === 'REPO_CALL_RESULT') renderRepoCallResult(message.payload);
};

/* ---- Panel 1: send any §6.1 message --------------------------------- */
for (const name of Object.keys(UI_TO_GL)) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  typeSelect.appendChild(option);
}

function fillExamplePayload() {
  payloadBox.value = JSON.stringify(EXAMPLES[typeSelect.value] ?? {}, null, 2);
}
typeSelect.addEventListener('change', fillExamplePayload);
fillExamplePayload();

document.getElementById('send-message').addEventListener('click', async () => {
  let payload;
  try {
    payload = payloadBox.value.trim() ? JSON.parse(payloadBox.value) : {};
  } catch (err) {
    alert(`Payload is not valid JSON: ${err.message}`);
    return;
  }
  const type = typeSelect.value;
  logMessage('UI→GL', type, payload);
  /* Reply arrives over the SSE stream and is logged there. */
  await fetch('/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload }),
  });
});

/* ---- Panel 2: free-text chat round trip ------------------------------ */
async function sendChat() {
  const input = document.getElementById('chat-text');
  const text = input.value.trim();
  if (!text) return;
  logMessage('UI→GL', 'CHAT_TEXT', { text });
  input.value = '';
  await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}
document.getElementById('send-chat').addEventListener('click', sendChat);
document.getElementById('chat-text').addEventListener('keydown', (evt) => {
  if (evt.key === 'Enter') sendChat();
});

/* ---- Panel 3: UI→GL→Repository→SQLite→back round trip ---------------- */
document.getElementById('repo-roundtrip').addEventListener('click', async () => {
  logMessage('UI→GL', 'REPO_ROUNDTRIP_DEMO', {});
  await fetch('/api/demo/repo-roundtrip', { method: 'POST' });
});

function renderRepoRows({ source, rows }) {
  const header = '<tr><th>category_id</th><th>category_name</th><th>description</th></tr>';
  const body = rows
    .map((r) => `<tr><td>${r.category_id}</td><td>${r.category_name}</td><td>${r.description ?? ''}</td></tr>`)
    .join('');
  repoRows.innerHTML =
    `<p>Rows read from <code>${source}</code>:</p><table>${header}${body}</table>`;
}

/* ---- Panel 4: invoke any §6.3 repository call via GL ------------------ */
const repoCallSelect = document.getElementById('repo-call-name');
const repoCallArgs = document.getElementById('repo-call-args');
const repoCallResult = document.getElementById('repo-call-result');

for (const name of REPO_CALLS) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  repoCallSelect.appendChild(option);
}

function fillExampleArgs() {
  repoCallArgs.value = JSON.stringify(REPO_CALL_EXAMPLES[repoCallSelect.value] ?? [], null, 2);
}
repoCallSelect.addEventListener('change', fillExampleArgs);
fillExampleArgs();

document.getElementById('invoke-repo-call').addEventListener('click', async () => {
  let args;
  try {
    args = repoCallArgs.value.trim() ? JSON.parse(repoCallArgs.value) : [];
  } catch (err) {
    alert(`Arguments are not valid JSON: ${err.message}`);
    return;
  }
  if (!Array.isArray(args)) {
    alert('Arguments must be a JSON array (in signature order), e.g. [1, "name"]');
    return;
  }
  logMessage('UI→GL', 'REPO_CALL_DEMO', { fn: repoCallSelect.value, args });
  /* GL→Repo call and Repo→GL result arrive over the SSE stream. */
  await fetch('/api/repo-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fn: repoCallSelect.value, args }),
  });
});

function renderRepoCallResult({ fn, result }) {
  repoCallResult.hidden = false;
  repoCallResult.textContent = `${fn} → ${JSON.stringify(result, null, 2)}`;
}

/* ---- Clear log -------------------------------------------------------- */
document.getElementById('clear-log').addEventListener('click', () => {
  logBox.innerHTML = '';
  repoRows.innerHTML = '';
  repoCallResult.hidden = true;
  repoCallResult.textContent = '';
});
