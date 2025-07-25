import type { Node, Edge, Connection } from 'reactflow';
import type { ExpressionEvaluator } from './lib/expressionParser';

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
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  executionContext: ExecutionContext;
  evaluator: ExpressionEvaluator;
  
  // Node operations
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: any) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  onConnect: (connection: Connection) => void;
  
  // Execution
  executeNode: (id: string) => Promise<void>;
  executeWorkflow: () => Promise<void>;
  clearNodeCache: (id: string) => Promise<void>;
  getNodeOutput: (id: string) => unknown;
  
  // Import/Export
  importWorkflow: (workflow: WorkflowGraph) => void;
  exportWorkflow: () => WorkflowGraph;
  
  // Data binding
  evaluateExpression: (expression: string, currentNodeId: string) => BindingValidation;
  getAvailableReferences: (currentNodeId: string) => DataReference[];
  updateNodeInputWithBinding: (nodeId: string, field: string, expression: string) => void;
  clearExecutionContext: () => void;
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

// Data Binding Types
export interface ExecutionContext {
  [nodeId: string]: {
    nodeTitle: string;
    output: unknown;
    executedAt: number;
    status: 'success' | 'error';
    error?: string;
  };
}

export interface DataReference {
  nodeId: string;
  nodeTitle: string;
  path: string;
  value: unknown;
  type: string;
}

export interface Expression {
  type: 'reference' | 'literal' | 'function' | 'accessor';
  value: string;
  path?: string[];
  args?: Expression[];
  source?: Expression;
}

export interface BindingValidation {
  isValid: boolean;
  error?: string;
  resolvedValue?: unknown;
  usedReferences?: string[];
} 