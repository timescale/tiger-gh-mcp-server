import { z } from 'zod';
import type { ZodRawShape, ZodTypeAny } from 'zod';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Router } from 'express';
import { Octokit } from '@octokit/rest';

export type ToolConfig<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
> = {
  title?: string;
  description?: string;
  inputSchema: InputArgs;
  outputSchema: OutputArgs;
  annotations?: ToolAnnotations;
};

export interface ApiDefinition<
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
> {
  name: string;
  config: ToolConfig<InputArgs, OutputArgs>;
  fn: (
    args: z.objectOutputType<InputArgs, ZodTypeAny>,
  ) => Promise<z.objectOutputType<OutputArgs, ZodTypeAny>>;
}

export interface ServerContext {
  octokit: Octokit;
  org: string;
}

export type ApiFactory<I extends ZodRawShape, O extends ZodRawShape> = (
  ctx: ServerContext,
) => ApiDefinition<I, O>;

/**
 * RouterFactory returns an Express Router and a cleanup function.
 */
export type RouterFactoryResult = [Router, () => void | Promise<void>];
export type RouterFactory = (ctx: ServerContext) => RouterFactoryResult;
