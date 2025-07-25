Initial Prompt:

The app idea is simple: I want to create an AI-assisted visual interface to create and test workflows, that now are being done with code using Mastra Workflows

The basic building block are the tools available for that workspace. I believe there are some tool available to return that, but assume that the workspace where an user develops an app has a couple of installed apps/integrations that give access to APIs, databases, AI Models and custom software that was previously deployed and these apps export tools, with input and output schema (MCP compatible)

I want to leverage reactflow to create nodes in a map, but I don't know the entire capacities of it 

Each node will be represented by a tool call.

We need a way to "connect" the data between the workflow steps. I think we need to have some kind of templating engine to render something smart in the textarea.

I want to provide a Zapier like experience of debugging, allowing the user to manually execute some step and save its results that can be used by others.

Realize there's liquid capacity to use AI for generating glue code that might be necessary for some steps. I believe this is key. Model a special type of node which is not a tool now but will be: "Run Typescript" and the prop is prompt: string. This, in execution time, will run that code. It will have available the data that was passed to it. This is very important.

I can always ask AI to change something in my workflow. But I can use the mouse to select only a portion and ask AI to change it there (underneath, the workflow is stored as a JSON. When we select something in the editor, the system "selects" that part of the array and ask AI to return a new model of only that fragment. Of course, there's always room to ask AI to change in general.

In that case, Generate Object from AI will be heavily used. Make sure to design the system to avoid wasting tokens, so, for example, requesting JSON diffs of some sort from the AI

There's an aspect where I probably need to allow custom UI to be generated for each workflow step. To like, override the default form view and be used instead to control the workflow inputs (maybe). I think it's a different view available, and can be used for controlling input but also visualizing the output and allowing some custom action there, I don't know


Current Ask:

*───────────────────────────────────────────────────────────────────────────┐
  FlowForge α – AI‑Assisted Workflow Builder  (MOCK BUILD TASK, v3)
 └───────────────────────────────────────────────────────────────────────────*/

/** 00. TL;DR
 * YOU ARE CLAUDE 4.  Produce a client‑only Vite React SPA that mocks
 * FlowForge α: users drag **Tool** or **Code** nodes from a toolbox onto a
 * ReactFlow canvas, edit custom titles, connect nodes linearly (no branches),
 * run individual steps or the full sequence, cache outputs, edit sub‑flows
 * when a Tool represents another workflow, and export/import the JSON graph
 * that follows an explicit DSL schema.  No backend, no cron, no auth.
 *
 * Node types:
 *   • ToolNode – wraps an installed‑app tool *or* a nested workflow reference
 *   • CodeNode – free‑form TypeScript (iteration, conditionals, parallelism)
 *
 * All control‑flow (if/loop/fan‑out) is accomplished inside CodeNode code.
 */


/*───────────────────────────────────────────────────────────────────────────┐
  01. Guiding Principles
 └───────────────────────────────────────────────────────────────────────────*/
const PRINCIPLES = {
  MIN_NODES   : "Only two node kinds: tool, code.",
  CODE_FIRST  : "All complex logic performed in CodeNode.",
  SUBFLOW_OPT : "ToolNode may point to another workflow & open editor modal.",
  AI_STUBS    : "Fake AI, user approves changes.",
  DSL_STRICT  : "Authoritative JSON Schema v0.2.0 shipped with app.",
}


/*───────────────────────────────────────────────────────────────────────────┐
  02. Tech Decisions
 └───────────────────────────────────────────────────────────────────────────*/
export const TECH = {
  ui       : "React 18 + ReactFlow v11 + Tailwind + shadcn/ui",
  state    : "Zustand",
  codeEdit : "Monaco for CodeNode",
  build    : "Vite",
  lint     : "biome",
}


/*───────────────────────────────────────────────────────────────────────────┐
  03. DSL Schema (v0.2.0)  – /src/schema/workflowSchema.json
 └───────────────────────────────────────────────────────────────────────────*/
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WorkflowGraph",
  "type": "object",
  "required": ["version","nodes","edges"],
  "properties": {
    "version": { "const": "0.2.0" },
    "nodes":  { "type": "array", "items": { "$ref": "#/definitions/node" } },
    "edges":  { "type": "array", "items": { "$ref": "#/definitions/edge" } }
  },
  "definitions": {
    "edge": {
      "type": "object",
      "required": ["id","source","target","data"],
      "properties": {
        "id": { "type": "string" },
        "source": { "type": "string" },
        "target": { "type": "string" },
        "data": { "type": "object", "additionalProperties": false }
      }
    },
    "node": {
      "type": "object",
      "required": ["id","type","position","data"],
      "properties": {
        "id": { "type": "string" },
        "type": { "enum": ["tool","code"] },
        "position": {
          "type": "object",
          "properties": { "x": { "type": "number" }, "y": { "type": "number" } },
          "required": ["x","y"]
        },
        "data": {
          "oneOf": [
            { "$ref": "#/definitions/toolData" },
            { "$ref": "#/definitions/codeData" }
          ]
        }
      }
    },
    "toolData": {
      "type": "object",
      "required": ["kind","title","ref"],
      "properties": {
        "kind": { "const": "tool" },
        "title": { "type": "string" },
        "ref": {
          "type": "object",
          "required": ["appId","toolId"],
          "properties": {
            "appId": { "type": "string" },
            "toolId": { "type": "string" }   /* may equal 'workflow:<id>' */
          }
        },
        "input":  { "type": "object", "default": {} },
        "outputCache": {}
      },
      "additionalProperties": false
    },
    "codeData": {
      "type": "object",
      "required": ["kind","title","code"],
      "properties": {
        "kind": { "const": "code" },
        "title": { "type": "string" },
        "code":  { "type": "string" },
        "outputCache": {}
      },
      "additionalProperties": false
    }
  }
}


/*───────────────────────────────────────────────────────────────────────────┐
  04. Build Tasks (strict)
 └───────────────────────────────────────────────────────────────────────────*/
// A. TOOLBOX SIDEBAR
//    – Load installedApps JSON (section 05).
//    – Each app entry exposes static mock tools array.
//    – Drag entry → ToolNode with default title.
//
// B. CANVAS
//    – Custom node renderer: icon + editable title.
//    – Edges encode execution order only; overall graph is a simple DAG.
//
// C. INSPECTOR PANEL
//    Tabs: Config / Run / Debug
//    • Config  – key‑value form for input.
//    • Run     – mockExecute returns { ok:true, ts:Date.now() }.
//    • Debug   – show cached output + Clear.
//    • CodeNode – Monaco + “AI Generate” stub.
//    • If ToolNode.ref.toolId starts with "workflow:", clicking “Edit
//      Sub‑workflow” opens nested canvas modal (simply re‑uses same editor
//      component on a new in‑memory graph).
//
// D. AI STUBS
//    fakeAI(prompt:string): string   // canned code or title
//
// E. WORKFLOW RUN MODAL
//    – Topologically sort nodes; execute sequentially.
//
// F. CACHE
//    – idb‑keyval per node.id.
//
// G. EXPORT / IMPORT
//    – Validate against workflowSchema.json before import.
//
// H. FILE STRUCTURE OUTPUT
//      /package.json
//      /vite.config.ts
//      /tailwind.config.js
//      /src/main.tsx
//      /src/App.tsx
//      /src/store.ts
//      /src/components/Toolbox.tsx
//      /src/components/Canvas.tsx
//      /src/components/Inspector.tsx
//      /src/components/RunModal.tsx
//      /src/components/SubflowModal.tsx
//      /src/schema/workflowSchema.json   ← DSL above
//      /src/data/installedApps.ts        ← JSON list verbatim
//      /src/types.ts
//      /eslintrc.json
//      /biome.json
//      /README.md
//
//    – Each file wrapped in ``` with filename header.  No text outside code
//      blocks except the README.
//
// I. TOKEN BUDGET  ≤ 1500.



/*───────────────────────────────────────────────────────────────────────────┐
  05. Installed Apps JSON
 └───────────────────────────────────────────────────────────────────────────*/
export const installedApps /* paste into /src/data/installedApps.ts */ =
<PASTE‑THE‑LONG‑JSON‑LIST‑HERE>;