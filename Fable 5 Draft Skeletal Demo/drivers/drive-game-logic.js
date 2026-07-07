/*
 * Driver: tests SS-02 Game Logic WITHOUT the UI.
 *
 * Sends each SRS §6.1 message to the running game-logic server and
 * prints the canned §6.2 reply returned in the POST body.
 *
 * Usage: start the server first (node game-logic/server.js), then:
 *        node drivers/drive-game-logic.js
 */
'use strict';

const M = require('../shared/messages.js');

const BASE_URL = 'http://localhost:3000';

async function main() {
  const types = Object.keys(M.UI_TO_GL); // the 13 §6.1 messages
  console.log(`Driving game-logic at ${BASE_URL} with ${types.length} SRS §6.1 messages...\n`);

  for (const type of types) {
    const payload = M.EXAMPLES[type] ?? {};
    const res = await fetch(`${BASE_URL}/api/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
    const reply = await res.json();
    console.log(`UI→GL  ${type}`);
    console.log(`GL→UI  ${reply.type}  ${JSON.stringify(reply.payload)}\n`);
  }

  console.log('Done — all 13 §6.1 messages round-tripped.');
}

main().catch((err) => {
  console.error(`Driver failed: ${err.message}`);
  console.error('Is the server running? Start it with: node game-logic/server.js');
  process.exit(1);
});
