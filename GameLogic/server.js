'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../Plumbing/messages.js');
const repository = require('../repository/repository.js');
const { default: GameSession } = require('../GameLogic/GameSession.js');

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

const session = new GameSession(pushToUI);

function handleUiMessage(incoming) {
  session.handleUI(incoming);
}

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
  const relative = urlPath === '/' ? '../UI/frontend/index.html' : urlPath.slice(1);
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

// Game Logic/UI Routing
const server = http.createServer((req, res) => {
  // Game Logic to UI
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

  // UI to Game Logic
  if (req.method === 'POST' && req.url === '/api/message') {
    readJsonBody(req, (err, msg) => {
      if (err) return sendJson(res, 400, { type: M.GL_TO_UI.ERROR, payload: { code: 'BAD_JSON', message: err.message } });
      sendJson(res, 200, handleUiMessage(msg));
    });
    return;
  }

  serveStatic(res, req.url.split('?')[0]);
});

server.listen(PORT, () => {
  console.log(`Game Logic listening — open http://localhost:${PORT}`);
});
