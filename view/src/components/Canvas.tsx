import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  SelectionMode,
} from 'reactflow';
import type {
  Node,
  Edge,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore, useUIStore } from '../store';
import type { FlowNode, FlowEdge, ToolData, CodeData } from '../types';
import { installedApps } from '../data/installedApps';
import { Link2, Bot, Edit3, Check, X, MousePointer2, Hand } from 'lucide-react';
import { Button } from './ui/button';

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
const ToolNodeComponent: React.FC<{ data: ToolData; selected: boolean; id: string }> = ({ data, selected, id }) => {
  const app = installedApps.find(a => a.id === data.ref.appId);
  const isWorkflow = data.ref.toolId.startsWith('workflow:');
  const hasDataBinding = Object.values(data.input || {}).some(
    value => typeof value === 'string' && value.includes('$')
  );
  
  const { selectedNodeIds, toggleNodeSelection } = useUIStore();
  const isMultiSelected = selectedNodeIds.has(id);
  const [showCheckbox, setShowCheckbox] = useState(false);
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleNodeSelection(id);
  };
  
  return (
    <div 
      className={`px-3 py-2 rounded-lg border-2 ${
        selected ? 'border-slate-400 shadow-sm' : 'border-slate-200'
      } ${isMultiSelected ? 'ring-2 ring-blue-400' : ''} bg-white shadow-sm min-w-[160px] relative`}
      onMouseEnter={() => setShowCheckbox(true)}
      onMouseLeave={() => setShowCheckbox(false)}
    >
      {/* Checkbox integrado ao node - mais visível */}
      <div 
        className={`absolute -top-2 -left-2 transition-all duration-200 ${
          showCheckbox || isMultiSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        onMouseDown={handleCheckboxClick}
        style={{ pointerEvents: showCheckbox || isMultiSelected ? 'auto' : 'none' }}
      >
        <div
          className={`w-7 h-7 rounded-full border-2 bg-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform
            ${isMultiSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-400 hover:border-blue-400'}`}
        >
          {isMultiSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>
      
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

const CodeNodeComponent: React.FC<{ data: CodeData; selected: boolean; id: string }> = ({ data, selected, id }) => {
  const { selectedNodeIds, toggleNodeSelection } = useUIStore();
  const isMultiSelected = selectedNodeIds.has(id);
  const [showCheckbox, setShowCheckbox] = useState(false);
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleNodeSelection(id);
  };
  
  return (
    <div 
      className={`px-3 py-2 rounded-lg border-2 ${
        selected ? 'border-slate-400 shadow-sm' : 'border-slate-300'
      } ${isMultiSelected ? 'ring-2 ring-blue-400' : ''} bg-slate-50 shadow-sm min-w-[160px] relative`}
      onMouseEnter={() => setShowCheckbox(true)}
      onMouseLeave={() => setShowCheckbox(false)}
    >
      {/* Checkbox integrado ao node - mais visível */}
      <div 
        className={`absolute -top-2 -left-2 transition-all duration-200 ${
          showCheckbox || isMultiSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        onMouseDown={handleCheckboxClick}
        style={{ pointerEvents: showCheckbox || isMultiSelected ? 'auto' : 'none' }}
      >
        <div
          className={`w-7 h-7 rounded-full border-2 bg-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform
            ${isMultiSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-400 hover:border-blue-400'}`}
        >
          {isMultiSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>
      
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

// Floating menu for selected nodes
const SelectionMenu: React.FC = () => {
  const { selectedNodeIds, openAgentChat, clearSelection } = useUIStore();
  const { nodes } = useWorkflowStore();
  
  if (selectedNodeIds.size === 0) return null;
  
  // Get selected nodes count
  const selectedCount = selectedNodeIds.size;
  
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white rounded-lg shadow-lg border border-slate-200 p-2">
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-600 px-2">
          {selectedCount} tool{selectedCount > 1 ? 's' : ''} selected
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <Button
          size="sm"
          variant="outline"
          onClick={() => openAgentChat('edit')}
          className="flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Edit with AI
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openAgentChat('agent')}
          className="flex items-center gap-2"
        >
          <Bot className="w-4 h-4" />
          Agent with this tools
        </Button>
        <div className="w-px h-6 bg-slate-200" />
        <Button
          size="sm"
          variant="ghost"
          onClick={clearSelection}
          className="px-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Selection Mode Toggle
const SelectionModeToggle: React.FC<{ isSelectionMode: boolean; onToggle: () => void }> = ({ isSelectionMode, onToggle }) => {
  return (
    <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-md border border-slate-200 p-1">
      <div className="flex items-center">
        <Button
          size="sm"
          variant={isSelectionMode ? "default" : "ghost"}
          onClick={onToggle}
          className="px-3"
          title="Selection Mode - Click and drag to select multiple nodes"
        >
          <MousePointer2 className="w-4 h-4 mr-2" />
          Select
        </Button>
        <Button
          size="sm"
          variant={!isSelectionMode ? "default" : "ghost"}
          onClick={onToggle}
          className="px-3"
          title="Pan Mode - Click and drag to move the canvas"
        >
          <Hand className="w-4 h-4 mr-2" />
          Pan
        </Button>
      </div>
      <div className="text-xs text-slate-500 px-2 pt-1 text-center">
        {isSelectionMode ? (
          <>Click & drag to select<br/>Press V for pan mode</>
        ) : (
          <>Click & drag to pan<br/>Press S for selection mode</>
        )}
      </div>
    </div>
  );
};

const Canvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(true); // Start in selection mode
  
  const { nodes, edges, selectedNodeId, setNodes, setEdges, onConnect, addNode, setSelectedNode } = useWorkflowStore();
  const { clearSelection, toggleNodeSelection, selectedNodeIds, selectNodes } = useUIStore();
  
  // Debug log
  useEffect(() => {
    console.log('Canvas mode:', isSelectionMode ? 'selection' : 'pan');
    console.log('Nodes selectable:', nodes.every(n => n.selectable !== false));
  }, [isSelectionMode, nodes]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key.toLowerCase() === 's') {
        setIsSelectionMode(true);
      } else if (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'p') {
        setIsSelectionMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(applyNodeChanges(changes, nodes));
  }, [nodes, setNodes]);
  
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(applyEdgeChanges(changes, edges));
  }, [edges, setEdges]);
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Check if Ctrl/Cmd is pressed for multi-selection
    if (event.ctrlKey || event.metaKey) {
      toggleNodeSelection(node.id);
    } else {
      setSelectedNode(node.id);
      // Clear multi-selection if clicking without Ctrl/Cmd
      if (selectedNodeIds.size > 0 && !selectedNodeIds.has(node.id)) {
        clearSelection();
      }
    }
  }, [setSelectedNode, toggleNodeSelection, selectedNodeIds, clearSelection]);
  
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    clearSelection();
  }, [setSelectedNode, clearSelection]);
  
  // Handle box selection
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    console.log('Selection changed:', nodes.length, 'nodes selected');
    if (nodes.length > 0) {
      const nodeIds = nodes.map(n => n.id);
      selectNodes(nodeIds);
    } else {
      // Clear selection when no nodes are selected by box
      clearSelection();
    }
  }, [selectNodes, clearSelection]);
  
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
        selectable: true,
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
    <div 
      className={`flex-1 bg-slate-50 relative ${isSelectionMode ? 'selection-mode' : 'pan-mode'}`} 
      ref={reactFlowWrapper}
    >
      <SelectionMenu />
      <SelectionModeToggle 
        isSelectionMode={isSelectionMode} 
        onToggle={() => setIsSelectionMode(!isSelectionMode)} 
      />
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
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          // Selection configuration based on mode
          selectionMode={SelectionMode.Partial}
          selectionOnDrag={isSelectionMode}
          selectNodesOnDrag={false}
          selectionKeyCode={isSelectionMode ? null : "Shift"}
          panOnScroll={!isSelectionMode}
          panOnDrag={!isSelectionMode}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          multiSelectionKeyCode={null}
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