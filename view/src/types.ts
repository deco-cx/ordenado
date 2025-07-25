import type { Node, Edge, Connection } from 'reactflow';

// Workflow Schema Types (v0.2.0)
export interface WorkflowGraph {
  version: '0.2.0';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  data: Record<string, never>; // empty object
}

export type WorkflowNode = ToolNode | CodeNode;

export interface BaseNode {
  id: string;
  type: 'tool' | 'code';
  position: { x: number; y: number };
}

export interface ToolNode extends BaseNode {
  type: 'tool';
  data: ToolData;
}

export interface CodeNode extends BaseNode {
  type: 'code';
  data: CodeData;
}

export interface ToolData {
  kind: 'tool';
  title: string;
  ref: {
    appId: string;
    toolId: string;
  };
  input?: Record<string, unknown>;
  outputCache?: unknown;
}

export interface CodeData {
  kind: 'code';
  title: string;
  code: string;
  outputCache?: unknown;
}

// App Types
export interface Tool {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface InstalledApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  tools: Tool[];
}

export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  items?: JsonSchemaProperty | Record<string, any>;
  default?: unknown;
  [key: string]: any;
}

export interface JsonSchemaProperty {
  type: string;
  default?: unknown;
  items?: JsonSchemaProperty | Record<string, any>;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  [key: string]: any;
}

// ReactFlow Extended Types
export type FlowNode = Node<ToolData | CodeData>;
export type FlowEdge = Edge;

// Store Types
export interface WorkflowStore {
  // Current workflow
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  
  // Actions
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: Partial<ToolData | CodeData>) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  
  // Connections
  onConnect: (connection: Connection) => void;
  
  // Import/Export
  exportWorkflow: () => WorkflowGraph;
  importWorkflow: (graph: WorkflowGraph) => void;
  
  // Execution
  executeNode: (nodeId: string) => Promise<void>;
  executeWorkflow: () => Promise<void>;
  
  // Cache
  clearNodeCache: (nodeId: string) => void;
  getNodeOutput: (nodeId: string) => unknown;
}

// Execution Types
export interface ExecutionResult {
  ok: boolean;
  timestamp: number;
  output?: unknown;
  error?: string;
}

// UI State Types
export interface InspectorTab {
  id: 'config' | 'run' | 'debug';
  label: string;
}

export interface SubflowModalState {
  isOpen: boolean;
  nodeId: string | null;
  workflowGraph: WorkflowGraph | null;
} 