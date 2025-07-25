# 🎯 Ordenado - AI-Assisted Visual Workflow Builder

> **⚠️ Work in Progress** - This is a concept application exploring the future of visual workflow automation. We're actively seeking feedback, contributions, and criticism to improve the design and implementation.

<img width="1908" height="934" alt="Image" src="https://github.com/user-attachments/assets/9f559b0c-e358-49d2-b809-391da65138ea" />

## 🌟 Vision

Ordenado aims to revolutionize how we create and manage automated workflows by combining the visual simplicity of tools like Zapier with the power of AI-assisted development and custom code execution. 

Instead of being limited to predefined integrations, Ordenado lets you:
- **Drag & drop** tools from your installed apps and integrations
- **Write custom TypeScript** for complex logic, loops, and parallel processing
- **Use AI assistance** to generate glue code between workflow steps
- **Debug step-by-step** with cached outputs and visual execution tracking
- **Edit sub-workflows** when a tool references another workflow

## 🚀 Current Status

**What's Working:**
- ✅ Visual workflow editor with ReactFlow
- ✅ Drag & drop tool library (AI Models, Database, HTTP, Email, Files)
- ✅ Two node types: Tool Nodes and Code Nodes
- ✅ AI code generation (mocked with smart templates)
- ✅ Individual node execution with output caching
- ✅ Full workflow execution with topological sorting
- ✅ Import/Export workflows as JSON (DSL v0.2.0)
- ✅ Real-time debugging interface
- ✅ Sub-workflow editing modal (UI ready)

**What's Planned:**
- 🔄 Real backend integration for tool execution
- 🔄 Advanced AI integration for smarter code generation
- 🔄 Live workspace integration with deco.chat platform
- 🔄 Branching and conditional workflow paths
- 🔄 Scheduled workflow execution
- 🔄 Collaboration features
- 🔄 Custom UI components for workflow inputs/outputs

## 🎮 Try It Now

```bash
# Clone the repository
git clone <your-repo-url>
cd ordenado

# Install dependencies
npm install

# Start development servers
npm run dev
```

Visit `http://localhost:4002/` to start building workflows!

## 💡 Core Concepts

### Two Node Types

**🔧 Tool Nodes**
- Wrap installed app tools (AI models, databases, APIs, etc.)
- Reference sub-workflows for modular design
- Configure inputs through dynamic forms based on tool schemas

**💻 Code Nodes**  
- Write custom TypeScript for any logic not covered by tools
- Handle iterations, conditionals, data transformations
- AI-assisted code generation from natural language prompts
- Full access to previous node outputs

### Execution Model

1. **Linear Flow**: Nodes connect in a directed acyclic graph (DAG)
2. **Topological Execution**: Automatic dependency resolution
3. **Output Caching**: Each node's output is cached for debugging
4. **Step-by-Step Debugging**: Run individual nodes or full workflows
5. **Error Handling**: Visual feedback for failed executions

### Workflow DSL

Workflows are stored as JSON following a strict schema (v0.2.0):

```json
{
  "version": "0.2.0",
  "nodes": [
    {
      "id": "node-1",
      "type": "tool",
      "position": { "x": 100, "y": 100 },
      "data": {
        "kind": "tool",
        "title": "Generate Text",
        "ref": { "appId": "ai-models", "toolId": "generate-text" },
        "input": { "prompt": "Hello world" }
      }
    }
  ],
  "edges": [...]
}
```

## 🏗️ Architecture

### Frontend (`/view`)
- **React 18** + TypeScript for the UI
- **ReactFlow v11** for the visual workflow editor  
- **Tailwind CSS** + shadcn/ui for beautiful, accessible components
- **Zustand** for state management
- **Monaco Editor** for code editing
- **idb-keyval** for client-side output caching

### Backend (`/server`) 
- **Cloudflare Workers** + Deco runtime for tool execution
- **MCP (Model Context Protocol)** compatible tool definitions
- Integration with deco.chat workspace for live tool access

### Key Files
```
ordenado/
├── view/src/
│   ├── components/
│   │   ├── Toolbox.tsx      # Drag & drop tool library
│   │   ├── Canvas.tsx       # ReactFlow workflow editor
│   │   ├── Inspector.tsx    # Node configuration panel
│   │   └── RunModal.tsx     # Workflow execution interface
│   ├── store.ts             # Zustand state management
│   ├── types.ts             # TypeScript type definitions
│   └── data/
│       └── installedApps.ts # Mock tool library
└── server/
    └── main.ts              # Cloudflare Worker entry point
```

## 🎯 Design Philosophy

### 1. **Code-First Control Flow**
Unlike traditional workflow builders that try to provide visual control structures, Ordenado embraces the power of code. All loops, conditions, and parallel processing happen in Code Nodes using familiar TypeScript syntax.

### 2. **AI as a Development Assistant**
AI doesn't replace developers—it assists them. Generate boilerplate, suggest transformations, but always with human oversight and approval.

### 3. **Zapier-like Debugging Experience**
Every step shows exactly what data flowed through it. Manual execution, cached outputs, and step-by-step debugging make workflows transparent and debuggable.

### 4. **Modular Sub-workflows**
Complex workflows can reference other workflows as tools, creating a composable architecture where common patterns can be shared and reused.

## 🤝 We Need Your Help!

This is an experimental project exploring what's possible when we combine visual workflow builders with modern development practices. We'd love your:

### 🎨 **Design Feedback**
- Is the visual metaphor intuitive?
- What workflow patterns are missing?
- How can we improve the debugging experience?

### 🔧 **Technical Contributions**
- Real backend integrations
- Advanced AI code generation
- Performance optimizations
- Testing infrastructure

### 💭 **Conceptual Input**
- What makes workflows hard to build and maintain?
- How do you currently handle complex automation?
- What would make you switch from your current tools?

### 🐛 **Bug Reports & Feature Requests**
Found something broken? Have an idea? Open an issue!

## 📝 Current Limitations

This is a **concept implementation** with several limitations:

- **Mock Execution**: All tool execution is simulated
- **No Persistence**: Workflows only exist in browser memory
- **Limited Tool Library**: Small set of predefined tools
- **No Authentication**: No user accounts or permissions
- **Client-Side Only**: No real backend integration yet

## 🚀 Getting Involved

1. **Try it**: Build a workflow and tell us what's confusing
2. **Fork it**: Make improvements and send pull requests  
3. **Break it**: Find edge cases and report bugs
4. **Extend it**: Add new tools, features, or integrations
5. **Critique it**: Tell us what we're doing wrong

## 📄 License

[Add your license here]

---

**Built with ❤️ for the future of workflow automation**

*Have feedback? Questions? Ideas? Open an issue or start a discussion!*
