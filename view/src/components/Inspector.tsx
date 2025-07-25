import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import SmartInput from './SmartInput';
import { useWorkflowStore, useUIStore } from '../store';
import { installedApps } from '../data/installedApps';
import type { ToolData, CodeData, JsonSchema, FlowNode } from '../types';
import { Play, Trash2, Edit, Sparkles, Variable } from 'lucide-react';
import Editor from '@monaco-editor/react';

const Inspector: React.FC = () => {
  const { selectedNodeId, nodes, updateNode, deleteNode, executeNode, clearNodeCache, getNodeOutput } = useWorkflowStore();
  const { openSubflowModal, aiPrompt, setAiPrompt, generateCode } = useUIStore();
  const [showDataBindingHint, setShowDataBindingHint] = useState(true);
  
  const selectedNode = nodes.find((n: FlowNode) => n.id === selectedNodeId);
  const [isExecuting, setIsExecuting] = useState(false);
  
  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-4">
        <div className="text-slate-500 text-center mt-8 text-sm">
          Select a node to configure
        </div>
      </div>
    );
  }
  
  const nodeData = selectedNode.data;
  const isCodeNode = nodeData.kind === 'code';
  const isWorkflowNode = !isCodeNode && (nodeData as ToolData).ref.toolId.startsWith('workflow:');
  
  // Get tool schema if it's a tool node
  let toolSchema: JsonSchema | null = null;
  if (!isCodeNode) {
    const toolData = nodeData as ToolData;
    const app = installedApps.find(a => a.id === toolData.ref.appId);
    const tool = app?.tools.find(t => t.id === toolData.ref.toolId);
    if (tool) {
      toolSchema = tool.inputSchema as JsonSchema;
    }
  }
  
  const handleTitleChange = (newTitle: string) => {
    updateNode(selectedNode.id, { title: newTitle });
  };
  
  const handleInputChange = (key: string, value: string) => {
    const currentInput = (nodeData as ToolData).input || {};
    updateNode(selectedNode.id, {
      input: { ...currentInput, [key]: value }
    });
  };
  
  const handleCodeChange = (code: string | undefined) => {
    if (code !== undefined) {
      updateNode(selectedNode.id, { code });
    }
  };
  
  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await executeNode(selectedNode.id);
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleAIGenerate = () => {
    const generatedCode = generateCode();
    updateNode(selectedNode.id, { code: generatedCode });
  };
  
  const renderInputField = (key: string, schema: JsonSchema) => {
    const value = ((nodeData as ToolData).input?.[key] || '') as string;
    
    return (
      <div key={key} className="mb-3">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {key}
          {schema.required?.includes(key) && <span className="text-rose-500 ml-1">*</span>}
        </label>
        <SmartInput
          value={value}
          onChange={(newValue) => handleInputChange(key, newValue)}
          placeholder={schema.default?.toString() || `Enter ${key}`}
          currentNodeId={selectedNode.id}
        />
      </div>
    );
  };
  
  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <Input
            value={nodeData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="font-medium text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteNode(selectedNode.id)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        {isWorkflowNode && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSubflowModal(selectedNode.id)}
            className="w-full text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Sub-workflow
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="config" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 bg-slate-100">
          <TabsTrigger value="config" className="text-sm">Config</TabsTrigger>
          <TabsTrigger value="run" className="text-sm">Run</TabsTrigger>
          <TabsTrigger value="debug" className="text-sm">Debug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config" className="flex-1 p-4 overflow-y-auto">
          {isCodeNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-800">TypeScript Code</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIGenerate}
                  className="text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </Button>
              </div>
              
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <Editor
                  height="300px"
                  defaultLanguage="typescript"
                  value={(nodeData as CodeData).code}
                  onChange={handleCodeChange}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  AI Prompt
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what this code should do..."
                  className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
                />
              </div>
            </div>
          ) : toolSchema ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-800">Input Parameters</h3>
                <Variable className="w-4 h-4 text-slate-400" />
              </div>
              
              {showDataBindingHint && (
                <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                  <p className="text-xs text-slate-600">
                    💡 <strong>Pro tip:</strong> Type <code className="px-1 py-0.5 bg-slate-200 rounded">$</code> to reference data from previous nodes
                  </p>
                  <button
                    onClick={() => setShowDataBindingHint(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              {Object.entries(toolSchema.properties || {}).map(([key, propSchema]) =>
                renderInputField(key, propSchema as JsonSchema)
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-sm">
              No configuration available
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="run" className="p-4">
          <div className="space-y-4">
            <Button
              onClick={handleExecute}
              disabled={isExecuting}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Executing...' : 'Execute Node'}
            </Button>
            
            {nodeData.outputCache !== undefined && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2 text-slate-800">Last Output</h3>
                <pre className="bg-slate-50 p-3 rounded-md text-xs overflow-auto border border-slate-200 text-slate-700">
                  {JSON.stringify(nodeData.outputCache, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="debug" className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-slate-800">Node Info</h3>
              <dl className="space-y-1 text-xs">
                <div>
                  <dt className="inline font-medium text-slate-700">ID:</dt>
                  <dd className="inline ml-2 text-slate-500">{selectedNode.id}</dd>
                </div>
                <div>
                  <dt className="inline font-medium text-slate-700">Type:</dt>
                  <dd className="inline ml-2 text-slate-500">{selectedNode.type}</dd>
                </div>
                {!isCodeNode && (
                  <>
                    <div>
                      <dt className="inline font-medium text-slate-700">App:</dt>
                      <dd className="inline ml-2 text-slate-500">{(nodeData as ToolData).ref.appId}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-slate-700">Tool:</dt>
                      <dd className="inline ml-2 text-slate-500">{(nodeData as ToolData).ref.toolId}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
            
            {nodeData.outputCache !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-800">Cached Output</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearNodeCache(selectedNode.id)}
                    className="text-slate-600 border-slate-200 hover:bg-slate-50"
                  >
                    Clear Cache
                  </Button>
                </div>
                <pre className="bg-slate-50 p-3 rounded-md text-xs overflow-auto border border-slate-200 text-slate-700">
                  {JSON.stringify(nodeData.outputCache, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inspector; 