#!/usr/bin/env node
import { apiFactories } from './apis/index.js';
import { httpServerFactory } from './shared/boilerplate/src/httpServer.js';
import { context, serverInfo } from './serverInfo.js';

httpServerFactory({
  ...serverInfo,
  context,
  apiFactories,
});
