#!/usr/bin/env node
import express, { NextFunction, Request, Response } from 'express';
import { mcpRouterFactory } from './http/mcp.js';
import { Octokit } from '@octokit/rest';
import { ServerContext } from './types.js';
import { apiRouterFactory } from './http/api.js';

const org = process.env.GITHUB_ORG;
if (!org) {
  throw new Error('GITHUB_ORG environment variable is required.');
}

if (!process.env.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN environment variable is required.');
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

console.error('Starting HTTP server...');

const app = express();

const context: ServerContext = { octokit, org };

const [mcpRouter, mcpCleanup] = mcpRouterFactory(context);
app.use(mcpRouter);

const [apiRouter, apiCleanup] = apiRouterFactory(context);
app.use('/api', apiRouter);

// Error handler
app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
  console.log('Received error:', err.message);
  res.status(500).send(err.message);
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.error(`HTTP Server listening on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down server...');

  await mcpCleanup();
  await apiCleanup();

  console.error('Server shutdown complete');
  process.exit(0);
});
