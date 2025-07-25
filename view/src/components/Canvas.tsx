import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from 'reactflow';
import type {
  Node,
  Edge,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../store';
import type { FlowNode, FlowEdge, ToolData, CodeData } from '../types';
import { installedApps } from '../data/installedApps';
import { Link2 } from 'lucide-react';

// Helper to check if node uses data binding
const nodeUsesDataBinding = (node: FlowNode): boolean => {
  if (node.data.kind === 'tool') {
    const input = node.data.input || {};
    return Object.values(input).some(
      value => typeof value === 'string' && value.includes('$')
    );
  }
  return false;
};

// Custom node components
const ToolNodeComponent: React.FC<{ data: ToolData; selected: boolean }> = ({ data, selected }) => {
  const app = installedApps.find(a => a.id === data.ref.appId);
  const isWorkflow = data.ref.toolId.startsWith('workflow:');
  const hasDataBinding = Object.values(data.input || {}).some(
    value => typeof value === 'string' && value.includes('$')
  );
  
  return (
    <div className={`px-3 py-2 rounded-lg border-2 ${
      selected ? 'border-slate-400 shadow-sm' : 'border-slate-200'
    } bg-white shadow-sm min-w-[160px] relative`}>
      <div className="flex items-center gap-2">
        <span className="text-base">{isWorkflow ? '🔄' : app?.icon || '📦'}</span>
        <div className="flex-1">
          <div className="font-medium text-sm text-slate-800">{data.title}</div>
          <div className="text-xs text-slate-500">{app?.name || 'Unknown'}</div>
        </div>
      </div>
      {data.outputCache !== undefined && (
        <div className="mt-1 text-xs text-emerald-600">✓ Cached</div>
      )}
      {hasDataBinding && (
        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
          <Link2 className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

const CodeNodeComponent: React.FC<{ data: CodeData; selected: boolean }> = ({ data, selected }) => {
  return (
    <div className={`px-3 py-2 rounded-lg border-2 ${
      selected ? 'border-slate-400 shadow-sm' : 'border-slate-300'
    } bg-slate-50 shadow-sm min-w-[160px]`}>
      <div className="flex items-center gap-2">
        <span className="text-base">💻</span>
        <div className="flex-1">
          <div className="font-medium text-sm text-slate-800">{data.title}</div>
          <div className="text-xs text-slate-600">Code Block</div>
        </div>
      </div>
      {data.outputCache !== undefined && (
        <div className="mt-1 text-xs text-emerald-600">✓ Cached</div>
      )}
    </div>
  );
};

const nodeTypes = {
  tool: ToolNodeComponent,
  code: CodeNodeComponent,
};

const Canvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
  const { nodes, edges, selectedNodeId, setNodes, setEdges, onConnect, addNode, setSelectedNode } = useWorkflowStore();
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(applyNodeChanges(changes, nodes));
  }, [nodes, setNodes]);
  
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(applyEdgeChanges(changes, edges));
  }, [edges, setEdges]);
  
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);
  
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);
  
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      if (!reactFlowInstance || !reactFlowWrapper.current) return;
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const data = event.dataTransfer.getData('application/reactflow');
      
      if (!data) return;
      
      const parsedData = JSON.parse(data);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const newNode: FlowNode = {
        id: `${Date.now()}`,
        position,
        type: parsedData.type === 'code' ? 'code' : 'tool',
        data: parsedData.type === 'code'
          ? {
              kind: 'code',
              title: 'New Code Block',
              code: '// Write your TypeScript code here\nreturn { result: "Hello World" };',
            }
          : {
              kind: 'tool',
              title: parsedData.toolName || 'New Tool',
              ref: {
                appId: parsedData.appId,
                toolId: parsedData.toolId,
              },
              input: {},
            },
      };
      
      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  return (
    <div className="flex-1 bg-slate-50" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: '#64748b' },
            type: 'smoothstep',
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <Controls className="bg-white border border-slate-200 rounded-lg shadow-sm" />
          <MiniMap 
            nodeColor={(node: Node) => {
              if (node.type === 'code') return '#f1f5f9';
              if (nodeUsesDataBinding(node as FlowNode)) return '#dbeafe';
              return '#ffffff';
            }}
            nodeStrokeColor={(node: Node) => {
              if (node.type === 'code') return '#cbd5e1';
              if (nodeUsesDataBinding(node as FlowNode)) return '#60a5fa';
              return '#e2e8f0';
            }}
            maskColor="#f8fafc"
            className="bg-white border border-slate-200 rounded-lg"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default Canvas; 