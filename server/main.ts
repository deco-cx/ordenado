// deno-lint-ignore-file require-await
import { withRuntime } from "@deco/workers-runtime";
import {
  createStepFromTool,
  createTool,
  createWorkflow,
} from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env as DecoEnv } from "./deco.gen.ts";

interface Env extends DecoEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const createMyTool = (_env: Env) =>
  createTool({
    id: "MY_TOOL",
    description: "Say hello",
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.object({ message: z.string() }),
    execute: async ({ context }) => ({
      message: `Hello, ${context.name}!`,
    }),
  });

const createGenerateObjectTool = (env: Env) =>
  createTool({
    id: "GENERATE_OBJECT",
    description: "Proxy for AI_GENERATE_OBJECT - converts between Mastra TypeScript code and Ordenado DSL JSON using AI",
    inputSchema: z.object({
      code: z.string().optional().describe("TypeScript Mastra workflow code to convert to DSL"),
      graph: z.any().optional().describe("DSL JSON graph to convert to TypeScript code"),
      schema: z.any().describe("JSON Schema that defines the target structure"),
      messages: z.array(z.object({
        role: z.string(),
        content: z.string(),
      })).optional().describe("Optional conversation context for AI"),
    }),
    outputSchema: z.any().describe("Generated graph or code based on input"),
    execute: async ({ context }) => {
      const { code, graph, schema, messages } = context;
      
      // Build the messages for AI generation
      const aiMessages = messages || [];
      
      if (code && !graph) {
        // Convert code to DSL
        aiMessages.push({
          role: "user",
          content: `Convert this Mastra TypeScript workflow code to the DSL JSON format according to the provided schema:

Code:
\`\`\`typescript
${code}
\`\`\`

Please analyze the code and extract:
1. Tool calls (steps that call env.INTEGRATION.TOOL methods)
2. Code blocks (data processing, mapping, logic between steps)
3. Workflow structure and data flow

Return a DSL JSON that represents this workflow structure.`
        });
      } else if (graph && !code) {
        // Convert DSL to code
        aiMessages.push({
          role: "user", 
          content: `Convert this DSL JSON to Mastra TypeScript workflow code:

DSL JSON:
\`\`\`json
${JSON.stringify(graph, null, 2)}
\`\`\`

Please generate clean, well-structured Mastra TypeScript code following these patterns:
1. Use createStep for tool calls
2. Use .map() for data processing between steps
3. Use proper TypeScript types and Zod schemas
4. Follow Mastra workflow best practices

Return only the TypeScript code.`
        });
      }

      const result = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
        messages: aiMessages,
        schema,
        model: "gpt-4o",
        temperature: 0.1,
      });

      return result;
    },
  });

const createMyWorkflow = (env: Env) => {
  const step = createStepFromTool(createMyTool(env));

  return createWorkflow({
    id: "MY_WORKFLOW",
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.object({ message: z.string() }),
  })
    .then(step)
    .commit();
};

const fallbackToView = (viewPath: string = "/") => (req: Request, env: Env) => {
  const LOCAL_URL = "http://localhost:4000";
  const url = new URL(req.url);
  const useDevServer = (req.headers.get("origin") || req.headers.get("host"))
    ?.includes("localhost");

  const request = new Request(
    useDevServer
      ? new URL(`${url.pathname}${url.search}`, LOCAL_URL)
      : new URL(viewPath, req.url),
    req,
  );

  return useDevServer ? fetch(request) : env.ASSETS.fetch(request);
};

const { Workflow, ...runtime } = withRuntime<Env>({
  workflows: [createMyWorkflow],
  tools: [createMyTool, createGenerateObjectTool],
  fetch: fallbackToView("/"),
});

export { Workflow };

export default runtime;
