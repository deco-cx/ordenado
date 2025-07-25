Ok, now I want a new feature and I want you to generate the good prompt as you always do for Cursor to code it. Consider it's a legit coder, knows the stack, likes to keep it simple and information dense

The feature I want to do is a separate "mode", at least initially, and its goal is to allow editing Typescript workflow code using Mastra Workflow SDK with a AI generated representation for the code using our DSL here that has Tool Call and Code types of nodes.

This is the first feature where we'll actually plug something real: the call to the GENERATE_OBJECT tool to call AI to perform our syncs both ways (code and JSON)

I want to do a separate mode because eventually we'll need a different data model for the nodes and the axioms, without losing anything we built so far.

The system should create the tool GENERATE_OBJECT to proxy the internal env.AI_GATEWAY.GENERATE_OBJECT that is available in the deco sdk and searchable in deco.gen.ts

And the React client code call it 

No AI calls should be made automatically initially.

I want buttons

Button to bootstrap the nodes from code (Import from Code (with AI icon)) that will open the textarea to paste the code and a button that will, minding the DSL data schema, use the GENERATE_OBJECT tool (instruct Cursor to figure out its schema) passing the schema of the DSL and apply to the canvas

And, after that, it needs to keep track of the state of the nodes. It should be editable. And it should keep track of the diffs.

And then, in the top bar for this mode, there's a button "Sync" that is only available when user has changed the code or the nodes since the laste generation/sync

This is an example workflow:
// deno-lint-ignore-file no-explicit-any
import { createStep, createWorkflow } from "@deco/workers-runtime/mastra";
import { z } from "zod";
import { Env } from "../../env.gen.ts";
import { TagOrder } from "../collections/tag_order.ts";
import { User } from "../collections/users.ts";

const toCSV = <T extends Record<string, unknown>>(
  data: T[],
  separator: string = ";",
): string => {
  const headers = Object.keys(data[0]);
  return [
    headers.join(separator),
    ...data.map((item) =>
      headers.map((header) =>
        typeof item[header] === "object"
          ? JSON.stringify(item[header])
          : item[header]
      ).join(separator)
    ),
  ].join("\n");
};

// Function to recursively clear null fields from objects
const clearNullFields = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(clearNullFields) as T;
  }

  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = clearNullFields(value);
      }
    }
    return cleaned as T;
  }

  return obj;
};

// Function to get or compute Clearsale score with caching
const getOrComputeClearsaleScore = async (
  uid: string,
  clearsaleData: any,
  env: Env,
): Promise<number> => {
  // First, try to get cached score from database
  const cachedResult = await env.DATABASE.DATABASES_RUN_SQL({
    sql: "SELECT score_value FROM clearsale_scores WHERE id = ?",
    params: [uid],
  });

  // @ts-expect-error - TODO: fix the output typings
  const score = cachedResult?.result?.[0]?.results?.[0]?.score_value;

  if (typeof score === "number") {
    return score;
  }

  // If not cached, compute the score
  const transactionResult = await env.CLEARSALE.CreateTransaction(
    clearsaleData,
  );
  const transactionId = transactionResult?.id;
  if (typeof transactionId !== "string") {
    throw new Error(
      "Finish: clearsale CreateTransaction failed: No transactionId returned.",
    );
  }

  const fraudScoreResults = await env.CLEARSALE.CreateFraudScore({
    transactionId,
  });
  // @ts-expect-error - TODO: fix the output typings
  const clearsaleScore = fraudScoreResults?.[0]?.value as number;
  if (typeof clearsaleScore !== "number") {
    throw new Error(
      "Finish: clearsale CreateFraudScore failed: No value returned.",
    );
  }

  // Store the computed score in the database
  await env.DATABASE.DATABASES_RUN_SQL({
    sql:
      "INSERT OR REPLACE INTO clearsale_scores (id, score_value, score_date) VALUES (?, ?, ?)",
    params: [uid, clearsaleScore, new Date().toISOString().split("T")[0]],
  });

  return clearsaleScore;
};

export const ParamsSchema = z.object({
  orderOrUserId: z.string().describe(
    "The order or user id to run the workflow for.",
  ),
  slackChannelId: z.string().optional(),
  numOrders: z.number().optional(),
});

export type Params = z.infer<typeof ParamsSchema>;

// Step 1: Lookup user and order
const lookupUserAndOrder = createStep({
  id: "lookup-user-and-order",
  inputSchema: ParamsSchema,
  outputSchema: z.object({
    uid: z.string(),
    user: z.any(),
  }),
  async execute(context) {
    const { orderOrUserId: value } = context.getInitData();
    const { runtimeContext } = context;
    const env = runtimeContext.get("env") as Env;

    let uid: string | undefined = undefined;
    let user: User | null = null;
    if (value.includes("@")) {
      const userRes = await env.SUPER_DATA_EXPLORER.MONGODB_RUN_QUERY({
        collection: "users",
        query: { email: value },
        limit: 1,
      });
      user = userRes.data[0] as User | undefined || null;
      uid = user?.uid;
    } else if (value.length === 20) { // isOrderId
      const orderRes = await env.SUPER_DATA_EXPLORER.MONGODB_RUN_QUERY({
        collection: "tag_order",
        query: { order_id: value },
        limit: 1,
      });
      const orderDoc = orderRes.data[0] as TagOrder | undefined;
      uid = orderDoc?.uid;
    } else if (value.length === 28) { // isUserId
      uid = value;
    }
    if (uid) {
      const userRes = await env.SUPER_DATA_EXPLORER.MONGODB_RUN_QUERY({
        collection: "users",
        query: { uid },
        limit: 1,
      });
      user = userRes.data[0] as User | undefined || null;
    }
    if (!user || !uid) {
      throw new Error(
        !user
          ? "Finish: No user found for the provided input."
          : !uid
          ? "Finish: No uid found for the provided input."
          : "Finish: No user or uid found for the provided input.",
      );
    }
    return { uid, user: clearNullFields(user) };
  },
});

// Step 2: Fetch last N orders for the user
const fetchLastOrders = createStep({
  id: "fetch-last-orders",
  inputSchema: z.any(),
  outputSchema: z.object({
    lastOrders: z.any(),
  }),
  async execute(context) {
    const { uid } = context.getStepResult(lookupUserAndOrder);
    const { runtimeContext } = context;
    const env = runtimeContext.get("env") as Env;
    const nOrders = context.getInitData().numOrders ?? 5;
    const ordersRes = await env.SUPER_DATA_EXPLORER.MONGODB_RUN_QUERY({
      collection: "tag_order",
      query: { uid },
      sort: { created_at: -1 },
      limit: nOrders,
    });
    const orders = (ordersRes?.data ?? []) as TagOrder[];
    if (!orders || orders.length === 0) {
      throw new Error(
        "Finish: Data gathering failed for orders: No orders returned.",
      );
    }
    // filter some data that might impact the analysis
    return {
      lastOrders: clearNullFields(orders.map((x: TagOrder) => ({
        ...x,
        payment: {
          ...(x.payment as any),
          iugu_data: { ...(x.payment as any)?.iugu_data, variables: null },
        },
      }))),
    };
  },
});

// Step 3: Agent antifraud analysis
const agentAntifraudAnalysis = createStep({
  id: "agent-antifraud-analysis",
  inputSchema: z.object({
    prompt: z.string(),
  }),
  outputSchema: z.object({
    risk: z.string(),
    reason: z.string(),
  }),
  async execute(context) {
    const { prompt } = context.inputData;
    const { uid } = context.getStepResult(lookupUserAndOrder);
    const env = context.runtimeContext.get("env") as Env;

    const response = await env.AGENT_ANTIFRAUD_SPECIALIST.AGENT_GENERATE_OBJECT(
      {
        message: prompt,
        schema: {
          type: "object",
          properties: {
            risk: {
              type: "string",
              description: "The risk level of the order.",
              enum: ["low", "medium", "high"],
            },
            reason: {
              type: "string",
              description: "The reason for the risk level.",
            },
          },
        },
      },
    );
    const risk = typeof response.object?.risk === "string"
      ? response.object.risk
      : "";
    const reason = typeof response.object?.reason === "string"
      ? response.object.reason
      : "";

    // Early exit for low/medium risk
    if (risk === "low") {
      return context.bail({ uid, risk, reason });
    }
    return { risk, reason };
  },
});

// Function to parse phone number with improved heuristics
const parsePhoneNumber = (phoneNumber: string | undefined) => {
  if (!phoneNumber) return {};

  // Remove any non-digit characters and leading +
  const digits = phoneNumber.replace(/[^\d]/g, "");

  if (digits.length < 8) return {};

  // Determine the phone number part (last 8 digits, or 9 if 9th from right is '9')
  let phoneLength = 8;
  if (digits.length >= 9 && digits[digits.length - 9] === "9") {
    phoneLength = 9;
  }

  const phone = digits.slice(-phoneLength);
  const remainingDigits = digits.slice(0, -phoneLength);

  let areaCode = "";
  let countryCode = "55"; // default to brazilian country code

  // If we have 2 or more digits remaining, the last 2 are area code
  if (remainingDigits.length >= 2) {
    areaCode = remainingDigits.slice(-2);
    const beforeAreaCode = remainingDigits.slice(0, -2);

    // If we have 2 or more digits before area code, they are country code
    if (beforeAreaCode.length >= 2) {
      countryCode = beforeAreaCode.slice(-2);
    }
  }

  return { countryCode, areaCode, phone };
};

// Step 4: Gather data for clearsale verification
const gatherClearsaleData = createStep({
  id: "gather-clearsale-data",
  inputSchema: z.any(),
  outputSchema: z.object({
    clearsaleData: z.any(),
  }),
  async execute(context) {
    const { lastOrders } = context.getStepResult(fetchLastOrders);
    const { user } = context.getStepResult(lookupUserAndOrder);

    const zipCode = lastOrders[0]?.data?.tag?.origin?.postcode;
    const { countryCode, areaCode, phone } = parsePhoneNumber(
      user.phone_number,
    );
    const hasPhone = countryCode && areaCode && phone;
    return {
      clearsaleData: {
        documentType: "CPF",
        document: user.cpf,
        name: user.name,
        email: user.email,
        birthdate: user.birthdate
          ? (user.birthdate as string).split("/").reverse().join("-")
          : undefined,
        ...(zipCode && { address: { zipCode } }),
        ...hasPhone && {
          phone: { countryCode, areaCode, number: phone },
        },
      },
    };
  },
});

// Step 5: Clearsale verification
const clearsaleVerification = createStep({
  id: "clearsale-verification",
  inputSchema: z.any(),
  outputSchema: z.object({
    clearsaleScore: z.number(),
  }),
  async execute(context) {
    const { clearsaleData } = context.getStepResult(gatherClearsaleData);
    const { uid } = context.getStepResult(lookupUserAndOrder);
    const { risk, reason } = context.getStepResult(agentAntifraudAnalysis);
    const { runtimeContext } = context;
    const env = runtimeContext.get("env") as Env;

    const clearsaleScore = risk === "high"
      ? await getOrComputeClearsaleScore(
        uid,
        clearsaleData,
        env,
      )
      : 0;

    // Bail if clearsaleScore is less than 69
    if (risk === "medium") {
      return context.bail({ uid, risk, reason, clearsaleScore });
    }
    return {
      clearsaleScore,
    };
  },
});

// Step 6: Reporting
const reporting = createStep({
  id: "reporting",
  inputSchema: z.any(),
  outputSchema: z.object({
    reported: z.boolean(),
  }),
  async execute(context) {
    const { clearsaleScore } = context.getStepResult(clearsaleVerification);
    const { uid } = context.getStepResult(lookupUserAndOrder);
    const { risk, reason } = context.getStepResult(agentAntifraudAnalysis);
    const { runtimeContext } = context;
    const env = runtimeContext.get("env") as Env;
    const SLACK = env.SLACK;
    const msg = [
      🧑 *User ID:* ${uid || "unknown"},
      📈 *Risk Level:* ${risk},
      clearsaleScore > 0 && 🔎 *Clearsale Score:* ${clearsaleScore},
      ✍️ *Summary:*,
      ${reason},
    ].filter(Boolean).join("\n");
    if (risk && reason && clearsaleScore) {
      await SLACK.MESSAGES_POST({
        channelId: context.getInitData().slackChannelId ??
          "C091TKYTG77",
        text: msg,
      });
    }
    return { uid, risk, reason, clearsaleScore, reported: true };
  },
});

// Compose the workflow, passing user through steps as needed
export const createAntifraudWorkflow = () =>
  createWorkflow({
    id: "Antifraud",
    description: "Antifraud workflow using Mastra",
    inputSchema: ParamsSchema,
    outputSchema: z.object({
      reported: z.boolean().optional(),
      clearsaleScore: z.number().optional(),
      risk: z.string().optional(),
      reason: z.string().optional(),
      uid: z.string().optional(),
      order_id: z.string().optional(),
    }),
  })
    .then(lookupUserAndOrder)
    .map(() => Promise.resolve({}))
    .then(fetchLastOrders)
    .map((context) => {
      const { lastOrders } = context.getStepResult(fetchLastOrders);
      const { user } = context.getStepResult(lookupUserAndOrder);

      const userTableCSV = Object.entries(user)
        .map(([k, v]) =>
          ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}
        )
        .join("\n");
      const ordersTableCSV = toCSV(lastOrders);
      const prompt = [
        Today is ${
          new Date().toISOString().split("T")[0]
        } and I need a fraud risk assessment for the following case.,
        `,
        User Info:,
        ${userTableCSV},
        `,
        Last ${lastOrders.length} Orders:,
        ${ordersTableCSV},
        `,
        Please analyze this data and provide a risk level assessment. Use portuguese as the language.,
      ].join("\n");
      return Promise.resolve({ prompt });
    })
    .then(agentAntifraudAnalysis)
    .map(() => Promise.resolve({}))
    .then(gatherClearsaleData)
    .map(() => Promise.resolve({}))
    .then(clearsaleVerification)
    .map(() => Promise.resolve({}))
    .then(reporting)
    .map(() => Promise.resolve({}))
    .commit();

I still have not figured out the best DSL, but could you?


/*───────────────────────────────────────────────────────────────────────────┐
  FEATURE:  “Code ⇄ Canvas” Mode  (Mastra ↔ DSL sync)
 └───────────────────────────────────────────────────────────────────────────*/

/** 00. TL;DR
 * Add a second editor mode that lets users paste a TypeScript workflow built
 * with **Mastra Workflow SDK** and round‑trip it to/from Ordenado’s JSON DSL
 * (Tool / Code nodes).  AI transformation is performed by a new tool
 * `GENERATE_OBJECT` which proxies `env.AI_GATEWAY.GENERATE_OBJECT`.
 *
 * UX:
 *   • Top bar toggle  [ Canvas Mode | <> Code Mode ]
 *   • Code Mode shows Monaco editor with TS syntax.
 *   • Button ①  “Import from Code  ✨”:
 *        – Opens modal textarea → paste MAS code → click “Generate”
 *        – Calls GENERATE_OBJECT once, with payload { code, schema: DSL_JSON_SCHEMA }
 *        – Replaces canvas graph + stores generated code snapshot.
 *   • Button ②  “Sync” (appears when code or graph diverge):
 *        – If user edits code → Sync pushes code → AI → graph update.
 *        – If user edits nodes → Sync pushes current DSL → AI → new code.
 *   • No AI calls happen automatically.
 *
 * Persistence:
 *   • `codeSnapshot` + `graphSnapshot` kept in Zustand; SHA‑256 diff triggers Sync badge.
 */

/*───────────────────────────────────────────────────────────────────────────┐
  01. DSL v0.4  (superset of v0.3)
 └───────────────────────────────────────────────────────────────────────────*/
export interface Workflow04 {
  version: "0.4.0";
  nodes: Array<ToolNodeData | CodeNodeData>;
  edges: Edge<EdgeData>[];
}
interface ToolNodeData {
  type: "tool";
  id: string;
  title: string;
  ref: { appId: string; toolId: string };
  input: Record<string, InputValue>;
}
interface CodeNodeData {
  type: "code";
  id: string;
  title: string;
  code: string;           // inline TS
}
type InputValue = Static | Binding | Expr;
interface Static   { kind: "static"; value: string }
interface Binding  { kind: "binding"; path: string }
interface Expr     { kind: "expr"; code: string }

/*───────────────────────────────────────────────────────────────────────────┐
  02. Backend – server/main.ts  (new tool)
 └───────────────────────────────────────────────────────────────────────────*/
createTool({
  id: "GENERATE_OBJECT",
  description: "Proxy for AI_GATEWAY.GENERATE_OBJECT",
  inputSchema: z.object({
    code:     z.string().optional(),   // when → graph
    graph:    z.any().optional(),      // when → code
    schema:   z.any(),                 // DSL json‑schema v0.4
  }),
  outputSchema: z.any(),               // returns graph or code
  async execute({ context, env }) {
    const payload = context.inputData;
    return await env.AI_GATEWAY.GENERATE_OBJECT(payload);
  },
})(env);

/*───────────────────────────────────────────────────────────────────────────┐
  03. Front‑end additions
 └───────────────────────────────────────────────────────────────────────────*/
FILES TO UPDATE / CREATE
────────────────────────────────────────────────────────
/src/store.ts
  • add `codeMode: boolean`
  • add `codeSnapshot?: string`, `graphSnapshot?: Workflow04`
  • add `setCode`, `setGraph`, `markSynced` helpers
/src/modes/CodeEditor.tsx          ← new
  • Monaco TS editor
  • “Import from Code ✨” modal
  • “Sync” button (disabled if no diff)
/src/components/TopbarModeToggle.tsx
  • switch between Canvas and CodeEditor
/src/api/generateObject.ts
  • thin client: POST to server tool
/src/schema/workflowSchema04.json   ← DSL schema
/src/utils/hash.ts                  ← SHA‑256 helper
ROUTING
  – extend TanStack router to mount CodeEditor on same path with query ?mode=code
STYLING
  – reuse shadcn/ui button + Badge red dot when unsynced

/*───────────────────────────────────────────────────────────────────────────┐
  04. Sync logic
 └───────────────────────────────────────────────────────────────────────────*/
onImportFromCode(code):
  result = await generateObject({ code, schema: DSL_SCHEMA })
  store.setGraph(result) ; store.setCode(code) ; store.markSynced()

onCanvasChange(graph):
  store.setGraph(graph)
  store.unsynced = hash(graph) !== hash(store.graphSnapshot)

onCodeChange(code):
  store.setCode(code)
  store.unsynced = hash(code) !== hash(store.codeSnapshot)

onClickSync():
  if (editingCode) {
     result = await generateObject({ code, schema: DSL_SCHEMA })
     store.setGraph(result)
  } else {
     result = await generateObject({ graph, schema: DSL_SCHEMA })
     store.setCode(result.code)
  }
  store.markSynced()

/*───────────────────────────────────────────────────────────────────────────┐
  05. Testing checklist
 └───────────────────────────────────────────────────────────────────────────*/
☑ Paste sample Mastra workflow → Generate → nodes appear  
☑ Edit a node title → Sync enabled → click Sync → code updated  
☑ Edit code comment → Sync enabled → click Sync → graph unchanged, unsynced=false  
☑ No AI call triggered on simple canvas drag until user clicks Sync  
☑ Fallback toast on GENERATE_OBJECT error

/*───────────────────────────────────────────────────────────────────────────┐
  06. Keep it tight
 └───────────────────────────────────────────────────────────────────────────*/
• Re‑use existing Monaco & ReactFlow components; no new dependencies.  
• Info‑dense code, prefer hooks over context where possible.  
• Unit tests for hash+diff util and store.  
• CI passes `npm run test && npm run typecheck` before commit.