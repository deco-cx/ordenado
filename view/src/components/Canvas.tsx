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

// Custom node components
const ToolNodeComponent: React.FC<{ data: ToolData; selected: boolean }> = ({ data, selected }) => {
  const app = installedApps.find(a => a.id === data.ref.appId);
  const isWorkflow = data.ref.toolId.startsWith('workflow:');
  
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-blue-500' : 'border-gray-300'} bg-white shadow-sm min-w-[180px]`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{isWorkflow ? '🔄' : app?.icon || '📦'}</span>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.title}</div>
          <div className="text-xs text-gray-500">{app?.name || 'Unknown'}</div>
        </div>
      </div>
      {data.outputCache !== undefined && (
        <div className="mt-2 text-xs text-green-600">✓ Cached</div>
      )}
    </div>
  );
};

const CodeNodeComponent: React.FC<{ data: CodeData; selected: boolean }> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-purple-500' : 'border-purple-300'} bg-purple-50 shadow-sm min-w-[180px]`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">💻</span>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.title}</div>
          <div className="text-xs text-purple-600">Code Block</div>
        </div>
      </div>
      {data.outputCache !== undefined && (
        <div className="mt-2 text-xs text-green-600">✓ Cached</div>
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
    <div className="flex-1" ref={reactFlowWrapper}>
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
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap 
            nodeColor={(node: Node) => {
              if (node.type === 'code') return '#9333ea';
              return '#3b82f6';
            }}
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default Canvas; 