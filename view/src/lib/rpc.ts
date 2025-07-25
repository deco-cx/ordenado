import { createClient } from "@deco/workers-runtime/client";
import type { Env } from "../../../server/deco.gen.ts";

// API client for GENERATE_OBJECT tool
export interface GenerateObjectParams {
  code?: string;
  graph?: any;
  schema: any;
  messages?: Array<{
    role: string;
    content: string;
  }>;
}

// Client typed as any until self-types are generated via npm run gen:self
// Will use proper Env types from deco.gen.ts once self-generation is complete
export const client = createClient<Env>();

export async function generateObject(params: GenerateObjectParams) {
  try {
    // Type assertion needed until self-types are generated
    const result = await client.SELF.GENERATE_OBJECT(params);
    return result;
  } catch (error) {
    console.error('Failed to call GENERATE_OBJECT:', error);
    throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
