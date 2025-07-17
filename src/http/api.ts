/**
 * REST API alternative to MCP for direct use of the same tools.
 */

import { Router } from 'express';
import { z } from 'zod';
import { RouterFactory } from '../types.js';
import { getRecentPRsInvolvingUserFactory } from '../apis/getRecentPRsInvolvingUser.js';

export const apiRouterFactory: RouterFactory = (context) => {
  const router = Router();

  const getRecentPRsInvolvingUserTool =
    getRecentPRsInvolvingUserFactory(context);
  router.get('/recent-prs-involving-user', async (req, res) => {
    const Input = z.object(getRecentPRsInvolvingUserTool.config.inputSchema);
    const { results } = await getRecentPRsInvolvingUserTool.fn(
      Input.parse(req.query),
    );
    res.json(results);
  });

  return [router, () => {}];
};
