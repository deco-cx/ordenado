# FlowForge α - AI-Assisted Workflow Builder

A visual workflow builder that allows users to create and test workflows using drag-and-drop components, similar to Zapier but with AI assistance.

## Features

- **Visual Workflow Editor**: Drag and drop tools from the toolbox to create workflows
- **Two Node Types**:
  - **Tool Nodes**: Call installed app tools or reference sub-workflows
  - **Code Nodes**: Write custom TypeScript for control flow (loops, conditions, parallel execution)
- **AI Code Generation**: Generate TypeScript code for Code Nodes using AI prompts
- **Step Execution**: Run individual nodes or entire workflows
- **Output Caching**: Cache node outputs for debugging and reuse
- **Sub-workflow Editing**: Edit nested workflows when a Tool Node references another workflow
- **Import/Export**: Save and load workflows as JSON files

## Tech Stack

- React 18 with TypeScript
- ReactFlow v11 for the visual workflow editor
- Tailwind CSS + shadcn/ui for styling
- Zustand for state management
- Monaco Editor for code editing
- idb-keyval for output caching

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Workflow DSL Schema (v0.2.0)

The workflow is stored as a JSON graph following a strict schema:

- **Nodes**: Tool nodes or Code nodes with position and configuration
- **Edges**: Connections between nodes defining execution order
- **Version**: Schema version for compatibility

## Usage

1. **Drag tools** from the toolbox onto the canvas
2. **Connect nodes** to define execution order
3. **Configure nodes** in the inspector panel
4. **Run workflows** using the Run button or execute individual nodes
5. **Export/Import** workflows for sharing or backup

## Mock Implementation

This is a showcase/demo implementation. Features include:

- Mock execution with simulated delays and outputs
- Pre-configured tool library with common integrations
- AI code generation with predefined responses
- Visual feedback for execution status

## Future Enhancements

- Real backend integration for actual tool execution
- More sophisticated AI integration for code generation
- Branching and conditional workflows
- Scheduled workflow execution
- Collaboration features 