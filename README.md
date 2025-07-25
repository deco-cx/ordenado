# Ordenado – Human‑Centric AI Workflow Builder

_This is a concept application_

> **⚠️ Work in Progress** - This is a concept application exploring the future of visual workflow automation. We're actively seeking feedback, contributions, and criticism to improve the design and implementation.

<img width="1908" height="934" alt="Image" src="https://github.com/user-attachments/assets/9f559b0c-e358-49d2-b809-391da65138ea" />


1 | Why now?
The AI industry is exiting its “✨ one‑click magic ✨” phase and moving toward reliable, human‑in‑the‑loop tooling. Developers no longer want opaque agents that vanish into 20‑step misfires or rack up $50 chat sessions—they want intelligent workspaces that ask clarifying questions, surface intermediate results, and keep them firmly in control. Structured, spec‑driven assistance that lets engineers stay the architect, while AI handles the tedium. Ordenado brings that same philosophy to workflow automation.

2 | The problem
Visual builders (Zapier, Make) are accessible but crumble on advanced logic (loops, conditionals, data transforms).

Code‑first tools (scripts, serverless functions) are powerful but slow to wire together, hard to debug, and siloed per developer.

Early “AI agents” promised autonomy but proved brittle: error compounding, ballooning token costs, and lack of transparency.

Teams need a system that combines visual clarity, code‑level power, and AI help—without the black‑box risks.

3 | The Ordenado approach
Principle	Implementation
Keep humans in the loop	All complex logic lives in Code Nodes you can read, edit, or AI‑generate—but must approve.
Minimal surface area	Only two node types: Tool Node (calls any installed integration or nested workflow) & Code Node (TypeScript).
Show your work	Step‑by‑step execution with cached outputs; click any value to trace its origin.
Composable by default	A finished workflow can be dragged onto another canvas as a Tool Node—promoting reuse without extra boilerplate.
Data binding made easy	Inline “chips” reference $PreviousStep.field[0] with live preview; short JSONPath‑lite expressions cover 90 % of mapping needs, leaving only edge cases to code.
AI as copilot, not autopilot	One‑click “Generate code” or “Map these fields” inserts draft snippets; the user confirms or edits. No hidden steps, no unbounded agent loops.

4 | Key capabilities (today)
Drag‑and‑drop canvas powered by React Flow

Installed‑tool library sourced from your Deco workspace (AI models, databases, HTTP, email, etc.)

Monaco‑based Code Node with TypeScript type‑checking

Mock AI templates (swappable for real LLMs)

Topological runner & debugger with output caching in IndexedDB

Import/Export JSON DSL v0.2.0 – plain text, version‑controlled, migration‑ready

5 | Why we’ll win
Trend	Ordenado’s fit
Human‑centric AI	Every action is inspectable; AI suggestions are never applied blindly.
Spec‑driven development	Workflows are themselves specs in JSON; Code Nodes compile those specs into action.
Micro‑agents & bounded scope	Tool + Code architecture encourages short, verifiable chains, avoiding the error snowball that plagues long autonomous runs.
Reusable building blocks	Nested workflows act like functions; teams build libraries instead of copy‑pasting zaps.
Cost transparency	No hidden chat loops; each node run = one deterministic cost.

6 | Roadmap highlights
Q3 ’25	Q4 ’25	2026 +
• Live MCP execution back‑end
• Real LLM integration with guardrails
• Data‑binding UI (chips + expression preview)	• Role‑based sharing & comments
• Scheduled runs & webhooks
• AI “explain my flow” documentation	• Marketplace for community workflows
• Multi‑tenant serverless hosting for micro‑flows
• Model‑aware cost optimizer

7 | Takeaway
Ordenado turns the hype curve into usable software.
It gives developers and power users a single canvas where visual clarity, code precision, and AI assistance coexist—every step transparent, every failure debuggable, every success reusable. In a market shifting from “autonomous miracles” to trustworthy copilots, Ordenado is the workflow builder that actually works.