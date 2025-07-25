import { create } from 'zustand';
import type { Connection, NodeChange, EdgeChange } from 'reactflow';
import { addEdge } from 'reactflow';
import { set as idbSet, get as idbGet } from 'idb-keyval';
import type { WorkflowStore, FlowNode, FlowEdge, WorkflowGraph, ExecutionResult } from './types';

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

// Mock execution
const mockExecute = async (nodeId: string): Promise<ExecutionResult> => {
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Random success/failure for demo
  const ok = Math.random() > 0.1;
  
  if (!ok) {
    return {
      ok: false,
      timestamp: Date.now(),
      error: 'Mock error: Connection timeout'
    };
  }
  
  // Generate mock output based on node type
  const mockOutputs = [
    { data: Array(5).fill(null).map((_, i) => ({ id: i, name: `Item ${i}` })) },
    { text: 'Generated response from AI model', tokens: 127 },
    { rows: [{ id: 1, value: 'test' }], rowCount: 1 },
    { success: true, message: 'Operation completed' }
  ];
  
  return {
    ok: true,
    timestamp: Date.now(),
    output: mockOutputs[Math.floor(Math.random() * mockOutputs.length)]
  };
};

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  
  setNodes: (nodes: FlowNode[]) => set({ nodes }),
  setEdges: (edges: FlowEdge[]) => set({ edges }),
  
  addNode: (node: FlowNode) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNode: (id: string, data: any) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === id 
        ? { ...node, data: { ...node.data, ...data } }
        : node
    )
  })),
  
  deleteNode: (id: string) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id),
    edges: state.edges.filter(e => e.source !== id && e.target !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
  })),
  
  setSelectedNode: (id: string | null) => set({ selectedNodeId: id }),
  
  onConnect: (connection: Connection) => {
    set((state) => ({
      edges: addEdge({ ...connection, id: generateId(), data: {} }, state.edges)
    }));
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
  
  executeNode: async (nodeId: string) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const result = await mockExecute(nodeId);
    
    if (result.ok) {
      // Cache the output
      await idbSet(`node-output-${nodeId}`, result.output);
      
      // Update node with cached output
      set((state) => ({
        nodes: state.nodes.map(n => 
          n.id === nodeId
            ? { ...n, data: { ...n.data, outputCache: result.output } }
            : n
        )
      }));
    }
  },
  
  executeWorkflow: async () => {
    const { nodes, edges } = get();
    
    // Simple topological sort for linear execution
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map(nodes.map(n => [n.id, 0]));
    
    edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    const queue = nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);
    const sorted: string[] = [];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sorted.push(nodeId);
      
      edges.filter(e => e.source === nodeId).forEach(edge => {
        const targetDegree = (inDegree.get(edge.target) || 0) - 1;
        inDegree.set(edge.target, targetDegree);
        if (targetDegree === 0) {
          queue.push(edge.target);
        }
      });
    }
    
    // Execute nodes in order
    for (const nodeId of sorted) {
      await get().executeNode(nodeId);
    }
  },
  
  clearNodeCache: async (nodeId: string) => {
    await idbSet(`node-output-${nodeId}`, null);
    
    set((state) => ({
      nodes: state.nodes.map(n => 
        n.id === nodeId
          ? { ...n, data: { ...n.data, outputCache: undefined } }
          : n
      )
    }));
  },
  
  getNodeOutput: (nodeId: string) => {
    const node = get().nodes.find(n => n.id === nodeId);
    return node?.data.outputCache;
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