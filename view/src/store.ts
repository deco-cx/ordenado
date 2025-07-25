import { create } from 'zustand';
import type { WorkflowStore, FlowNode, FlowEdge, WorkflowGraph, ExecutionResult, ExecutionContext, BindingValidation } from './types';
import type { Connection } from 'reactflow';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import type { NodeChange, EdgeChange } from 'reactflow';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { ExpressionEvaluator } from './lib/expressionParser';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Fake AI helper
const fakeAI = (prompt: string): string => {
  if (prompt.toLowerCase().includes('fetch')) {
    return `// Fetch data from API
const response = await fetch(input.url);
const data = await response.json();
return { data, status: response.status };`;
  }
  if (prompt.toLowerCase().includes('transform')) {
    return `// Transform data
const transformed = input.data.map(item => ({
  ...item,
  processed: true,
  timestamp: Date.now()
}));
return { transformed };`;
  }
  if (prompt.toLowerCase().includes('filter')) {
    return `// Filter data
const filtered = input.items.filter(item => 
  item.active && item.value > input.threshold
);
return { filtered, count: filtered.length };`;
  }
  return `// Generated code
console.log('Processing:', input);
// TODO: Implement logic
return { result: 'success' };`;
};

// Mock execution function
async function executeNodeMock(node: FlowNode): Promise<ExecutionResult> {
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Random success/failure
  if (Math.random() < 0.9) {
    // Generate different mock outputs based on node type/tool
    let output: any = { success: true, timestamp: new Date().toISOString() };
    
    if (node.data.kind === 'tool') {
      const toolData = node.data;
      
      // Mock outputs based on tool ID
      if (toolData.ref.toolId === 'TEAMS_LIST') {
        output = {
          teams: [
            { id: 1, name: 'Engineering', memberCount: 12 },
            { id: 2, name: 'Product', memberCount: 8 },
            { id: 3, name: 'Design', memberCount: 5 }
          ]
        };
      } else if (toolData.ref.toolId === 'DATABASES_RUN_SQL') {
        output = {
          results: [
            { id: 1, email: 'john@example.com', name: 'John Doe', role: 'admin' },
            { id: 2, email: 'jane@example.com', name: 'Jane Smith', role: 'user' },
            { id: 3, email: 'bob@example.com', name: 'Bob Johnson', role: 'user' }
          ],
          rowCount: 3
        };
      } else if (toolData.ref.toolId === 'AI_GENERATE') {
        // Check if prompt contains references to teams
        const promptValue = toolData.input?.prompt;
        const prompt = typeof promptValue === 'string' ? promptValue : '';
        if (prompt.includes('team') || prompt.includes('Team')) {
          output = {
            text: "Based on the teams data: Engineering has 12 members, Product has 8 members, and Design has 5 members. The total workforce is 25 people across 3 teams.",
            model: 'gpt-4',
            usage: { promptTokens: 50, completionTokens: 35 }
          };
        } else {
          output = {
            text: `Generated response for: ${prompt.substring(0, 50)}...`,
            model: 'gpt-4',
            usage: { promptTokens: 20, completionTokens: 30 }
          };
        }
      } else if (toolData.ref.toolId === 'AIRTABLE_LIST_RECORDS') {
        output = {
          records: [
            { 
              id: 'rec1', 
              fields: { 
                Title: 'Q4 Planning', 
                Status: 'In Progress',
                AssignedTo: 'john@example.com',
                DueDate: '2024-12-31'
              } 
            },
            { 
              id: 'rec2', 
              fields: { 
                Title: 'Design Review', 
                Status: 'Pending',
                AssignedTo: 'jane@example.com',
                DueDate: '2024-12-15'
              } 
            }
          ]
        };
      } else {
        // Generic mock output
        output = {
          result: `Processed ${JSON.stringify(toolData.input).length} characters of input`,
          processedAt: new Date().toISOString()
        };
      }
    } else {
      // Code node - mock execution
      output = {
        result: 'Code executed successfully',
        returnValue: { computed: Math.random() * 100 }
      };
    }
    
    return output;
  } else {
    throw new Error('Mock execution failed');
  }
}

// Helper to resolve input values with data binding
function resolveInputValues(
  input: Record<string, any>,
  evaluator: ExpressionEvaluator,
  context: ExecutionContext,
  nodeId: string
): Record<string, any> {
  const resolved: Record<string, any> = {};
  
  Object.entries(input).forEach(([key, value]) => {
    if (typeof value === 'string' && evaluator.containsReferences(value)) {
      // Try to interpolate the value
      const interpolated = evaluator.interpolate(value, context, nodeId);
      resolved[key] = interpolated;
    } else {
      resolved[key] = value;
    }
  });
  
  return resolved;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  executionContext: {},
  
  // Expression evaluator instance
  evaluator: new ExpressionEvaluator(),
  
  setNodes: (nodes: FlowNode[]) => set({ nodes }),
  setEdges: (edges: FlowEdge[]) => set({ edges }),
  
  addNode: (node: FlowNode) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNode: (id: string, data: any) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
  },
  
  deleteNode: (id: string) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    }));
  },
  
  setSelectedNode: (id: string | null) => set({ selectedNodeId: id }),
  
  onConnect: (connection: Connection) => {
    const newEdge: FlowEdge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
    };
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },
  
  exportWorkflow: () => {
    const state = get();
    const workflow: WorkflowGraph = {
      version: '0.2.0',
      nodes: state.nodes.map(node => {
        if (node.type === 'tool') {
          return {
            id: node.id,
            type: 'tool' as const,
            position: node.position,
            data: node.data as import('./types').ToolData
          };
        } else {
          return {
            id: node.id,
            type: 'code' as const,
            position: node.position,
            data: node.data as import('./types').CodeData
          };
        }
      }),
      edges: state.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {}
      }))
    };
    return workflow;
  },
  
  importWorkflow: (graph: WorkflowGraph) => {
    set({
      nodes: graph.nodes.map(node => ({
        ...node,
        type: node.type,
        data: node.data
      } as FlowNode)),
      edges: graph.edges,
      selectedNodeId: null
    });
  },
  
  executeNode: async (id: string) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === id);
    if (!node) return;
    
    try {
      // Resolve input values with data binding
      let nodeToExecute = node;
      if (node.data.kind === 'tool' && node.data.input) {
        const resolvedInput = resolveInputValues(
          node.data.input,
          state.evaluator,
          state.executionContext,
          id
        );
        nodeToExecute = {
          ...node,
          data: {
            ...node.data,
            input: resolvedInput
          }
        };
      }
      
      const result = await executeNodeMock(nodeToExecute);
      
      // Update node with output
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, outputCache: result } } : n
        ),
      }));
      
      // Update execution context
      set((state) => ({
        executionContext: {
          ...state.executionContext,
          [id]: {
            nodeTitle: node.data.title,
            output: result,
            executedAt: Date.now(),
            status: 'success'
          }
        }
      }));
      
      // Cache result
      await idbSet(`node-output-${id}`, result);
    } catch (error) {
      // Update execution context with error
      set((state) => ({
        executionContext: {
          ...state.executionContext,
          [id]: {
            nodeTitle: node.data.title,
            output: null,
            executedAt: Date.now(),
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }));
      console.error('Node execution failed:', error);
    }
  },
  
  executeWorkflow: async () => {
    // TODO: Implement workflow execution with topological sort
  },
  
  clearNodeCache: async (id: string) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, outputCache: undefined } } : n
      ),
    }));
    await idbDel(`node-output-${id}`);
    
    // Remove from execution context
    set((state) => {
      const newContext = { ...state.executionContext };
      delete newContext[id];
      return { executionContext: newContext };
    });
  },
  
  getNodeOutput: (id: string) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === id);
    return node?.data.outputCache;
  },
  
  // Data binding methods
  evaluateExpression: (expression: string, currentNodeId: string): BindingValidation => {
    const state = get();
    return state.evaluator.evaluate(expression, state.executionContext, currentNodeId);
  },
  
  getAvailableReferences: (currentNodeId: string) => {
    const state = get();
    return state.evaluator.getAvailableReferences(state.executionContext, currentNodeId);
  },
  
  updateNodeInputWithBinding: (nodeId: string, field: string, expression: string) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node || node.data.kind !== 'tool') return;
    
    const currentInput = node.data.input || {};
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                input: {
                  ...currentInput,
                  [field]: expression
                }
              }
            }
          : n
      ),
    }));
  },
  
  clearExecutionContext: () => {
    set({ executionContext: {} });
  }
}));

// Helper store for UI state
interface UIStore {
  isRunModalOpen: boolean;
  setRunModalOpen: (open: boolean) => void;
  
  isSubflowModalOpen: boolean;
  subflowNodeId: string | null;
  openSubflowModal: (nodeId: string) => void;
  closeSubflowModal: () => void;
  
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  generateCode: () => string;
}

export const useUIStore = create<UIStore>((set, get) => ({
  isRunModalOpen: false,
  setRunModalOpen: (open: boolean) => set({ isRunModalOpen: open }),
  
  isSubflowModalOpen: false,
  subflowNodeId: null,
  openSubflowModal: (nodeId: string) => set({ isSubflowModalOpen: true, subflowNodeId: nodeId }),
  closeSubflowModal: () => set({ isSubflowModalOpen: false, subflowNodeId: null }),
  
  aiPrompt: '',
  setAiPrompt: (prompt: string) => set({ aiPrompt: prompt }),
  generateCode: () => fakeAI(get().aiPrompt)
})); 