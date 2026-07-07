/*
 * SS-02 Game Logic — SKELETAL increment.
 *
 * Node.js server. Owns the connection to the UI (transport: HTTP POST
 * for UI→GL, Server-Sent Events for GL→UI) and imports the repository
 * module (SS-03).
 *
 * Every SRS §6.1 message is received by a stub handler that logs it and
 * replies with a canned instance of the mapped §6.2 message (see
 * shared/messages.js REPLY_MAP). Responses are HARDCODED — no rule
 * evaluation, no state machine. See CLAUDE.md and SKELETAL_NOTES.md.
 *
 * Run:  node game-logic/server.js   then open  http://localhost:3000
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../shared/messages.js');
const repository = require('../repository/repository.js');

const PORT = 3000;
const ROOT = path.join(__dirname, '..');

/* ---- GL→UI channel: Server-Sent Events ---------------------------- */
const sseClients = new Set();

function broadcast(message) {
  for (const res of sseClients) {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  }
}

function pushToUI(message) {
  console.log(`[GL→UI] ${message.type} ${JSON.stringify(message.payload)}`);
  broadcast(message);
}

/* ---- §6.1 stub handling -------------------------------------------- */
function handleUiMessage(incoming) {
  console.log(`[UI→GL] ${incoming.type} ${JSON.stringify(incoming.payload ?? {})}`);

  const replyType = M.REPLY_MAP[incoming.type];
  const reply = replyType
    ? { type: replyType, payload: M.EXAMPLES[replyType] }
    : { type: M.GL_TO_UI.ERROR, payload: M.EXAMPLES.ERROR };

  pushToUI(reply);
  return reply;
}

/* ---- HTTP plumbing -------------------------------------------------- */
function readJsonBody(req, callback) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (err) {
      callback(err);
    }
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.ico': 'image/x-icon',
};

function serveStatic(res, urlPath) {
  const relative = urlPath === '/' ? 'ui/index.html' : urlPath.slice(1);
  const filePath = path.normalize(path.join(ROOT, relative));
  const allowed = filePath.startsWith(path.join(ROOT, 'ui')) ||
    filePath.startsWith(path.join(ROOT, 'shared'));
  if (!allowed || !fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
}

/* ---- Routes ---------------------------------------------------------- */
const server = http.createServer((req, res) => {
  /* GL→UI event stream */
  if (req.method === 'GET' && req.url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  /* UI→GL: any SRS §6.1 message. Reply is also returned in the POST
   * body so the drive-game-logic.js driver can test GL without the UI. */
  if (req.method === 'POST' && req.url === '/api/message') {
    readJsonBody(req, (err, msg) => {
      if (err) return sendJson(res, 400, { type: M.GL_TO_UI.ERROR, payload: { code: 'BAD_JSON', message: err.message } });
      sendJson(res, 200, handleUiMessage(msg));
    });
    return;
  }

  /* Demo-only free-text chat: round-trips UI→GL→UI. Not an SRS message. */
  if (req.method === 'POST' && req.url === '/api/chat') {
    readJsonBody(req, (err, msg) => {
      if (err) return sendJson(res, 400, { error: err.message });
      console.log(`[UI→GL] CHAT_TEXT ${JSON.stringify(msg)}`);
      const reply = { type: 'CHAT_TEXT', payload: { text: `Game Logic received: "${msg.text}"` } };
      pushToUI(reply);
      sendJson(res, 200, reply);
    });
    return;
  }

  /* Demo-only: have GL invoke any SRS §6.3 repository call. Both sides
   * (GL→Repo call and Repo→GL result) are broadcast so the demo shows
   * the conversation; the console shows the same via the repo module's
   * own logging plus the result line below. */
  if (req.method === 'POST' && req.url === '/api/repo-call') {
    readJsonBody(req, (err, msg) => {
      if (err) return sendJson(res, 400, { type: M.GL_TO_UI.ERROR, payload: { code: 'BAD_JSON', message: err.message } });
      const { fn, args = [] } = msg;
      if (!M.REPO_CALLS.includes(fn) || typeof repository[fn] !== 'function') {
        return sendJson(res, 400, {
          type: M.GL_TO_UI.ERROR,
          payload: { code: 'UNKNOWN_REPO_CALL', message: `Not an SRS §6.3 call: ${fn}` },
        });
      }
      console.log(`[UI→GL] REPO_CALL_DEMO ${fn} (demo harness request)`);
      broadcast({ type: 'REPO_CALL', direction: 'GL→Repo', payload: { fn, args } });
      const result = repository[fn](...args); // repo module logs the [GL→Repo] side
      console.log(`[Repo→GL] ${fn} → ${JSON.stringify(result)}`);
      const reply = { type: 'REPO_CALL_RESULT', direction: 'Repo→GL', payload: { fn, result } };
      broadcast(reply);
      sendJson(res, 200, reply);
    });
    return;
  }

  /* Demo-only: full UI→GL→Repository→SQLite→back round trip. */
  if (req.method === 'POST' && req.url === '/api/demo/repo-roundtrip') {
    console.log('[UI→GL] REPO_ROUNDTRIP_DEMO (demo harness request)');
    const rows = repository.getAllCategories();
    const reply = { type: 'REPO_READ_RESULT', payload: { source: 'repository/questions.sqlite', rows } };
    pushToUI(reply);
    sendJson(res, 200, reply);
    return;
  }

  serveStatic(res, req.url.split('?')[0]);
});

server.listen(PORT, () => {
  console.log(`[GL] Game Logic (SS-02) listening — open http://localhost:${PORT}`);
  console.log('[GL] Skeletal increment: stub handlers with canned replies only.');
});
