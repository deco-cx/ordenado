import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { useWorkflowStore, useUIStore } from '../store';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { FlowNode, FlowEdge } from '../types';

interface RunStep {
  nodeId: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'error';
  output?: unknown;
  error?: string;
}

const RunModal: React.FC = () => {
  const { isRunModalOpen, setRunModalOpen } = useUIStore();
  const { nodes, edges, executeWorkflow } = useWorkflowStore();
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<RunStep[]>([]);
  
  const getNodeExecutionOrder = () => {
    // Simple topological sort
    const nodeMap = new Map(nodes.map((n: FlowNode) => [n.id, n]));
    const inDegree = new Map(nodes.map((n: FlowNode) => [n.id, 0]));
    
    edges.forEach((edge: FlowEdge) => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    const queue = nodes.filter((n: FlowNode) => inDegree.get(n.id) === 0).map((n: FlowNode) => n.id);
    const sorted: string[] = [];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sorted.push(nodeId);
      
      edges.filter((e: FlowEdge) => e.source === nodeId).forEach((edge: FlowEdge) => {
        const targetDegree = (inDegree.get(edge.target) || 0) - 1;
        inDegree.set(edge.target, targetDegree);
        if (targetDegree === 0) {
          queue.push(edge.target);
        }
      });
    }
    
    return sorted.map(id => {
      const node = nodeMap.get(id)!;
      return {
        nodeId: id,
        title: node.data.title,
        status: 'pending' as const,
      };
    });
  };
  
  const handleRun = async () => {
    const executionOrder = getNodeExecutionOrder();
    setSteps(executionOrder);
    setIsRunning(true);
    
    // Simulate step-by-step execution
    for (let i = 0; i < executionOrder.length; i++) {
      const step = executionOrder[i];
      
      // Update step to running
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'running' } : s
      ));
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
      
      // Random success/failure for demo
      const success = Math.random() > 0.15;
      
      setSteps(prev => prev.map((s, idx) => 
        idx === i 
          ? {
              ...s,
              status: success ? 'success' : 'error',
              output: success ? { result: `Output from ${s.title}` } : undefined,
              error: success ? undefined : 'Mock error: Connection timeout'
            }
          : s
      ));
      
      if (!success) {
        break; // Stop on error
      }
    }
    
    setIsRunning(false);
  };
  
  const getStatusIcon = (status: RunStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };
  
  return (
    <Dialog open={isRunModalOpen} onOpenChange={setRunModalOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Run Workflow</DialogTitle>
          <DialogDescription>
            Execute all nodes in the workflow sequentially
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {!isRunning && steps.length === 0 && (
            <Button onClick={handleRun} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Workflow Execution
            </Button>
          )}
          
          {steps.length > 0 && (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.nodeId}
                  className={`border rounded-lg p-4 ${
                    step.status === 'running' ? 'border-blue-300 bg-blue-50' :
                    step.status === 'success' ? 'border-green-300 bg-green-50' :
                    step.status === 'error' ? 'border-red-300 bg-red-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{step.title}</h4>
                        <span className="text-xs text-gray-500">
                          Step {index + 1} of {steps.length}
                        </span>
                      </div>
                      
                      {step.output !== undefined && step.output !== null && (
                        <pre className="mt-2 text-xs bg-white p-2 rounded border">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      )}
                      
                      {step.error && (
                        <div className="mt-2 text-sm text-red-600">
                          {step.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {!isRunning && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleRun} variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Run Again
                  </Button>
                  <Button
                    onClick={() => {
                      setSteps([]);
                      setRunModalOpen(false);
                    }}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RunModal; 