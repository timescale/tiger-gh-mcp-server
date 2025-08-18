import 'dotenv/config';
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { createServer } from "node:http";

import { insertEvent } from './repositories/event-repository.js';

if (!process.env.WEBHOOK_SECRET) {
  throw new Error("Missing WEBHOOK_SECRET");
}
if (!process.env.WEBHOOK_PORT) {
  throw new Error("Missing WEBHOOK_PORT");
}

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
});

webhooks.onAny(({ id, name, payload }) => {
  if (!payload) {
    return;
  }
  // Some events do not define actions, not sure why.
  const action = 'action' in payload ? payload.action : '';
  insertEvent({
    id,
    event: name,
    action,
    payload: JSON.stringify(payload),
  })
    .then(() => {
      console.log(`Inserted event ${id} (${name})`);
    })
    .catch((err) => {
      console.error(`Failed to insert event ${id} (${name})`);
    });
});

createServer(
  createNodeMiddleware(webhooks, { path: '/webhooks' })
).listen(process.env.WEBHOOK_PORT, () => {
  console.log(`Webhook server listening on port ${process.env.WEBHOOK_PORT}`);
});
