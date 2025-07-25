import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useUIStore, useWorkflowStore } from '../store';
import type { FlowNode } from '../types';

const SubflowModal: React.FC = () => {
  const { isSubflowModalOpen, subflowNodeId, closeSubflowModal } = useUIStore();
  const { nodes } = useWorkflowStore();
  
  const subflowNode = nodes.find((n: FlowNode) => n.id === subflowNodeId);
  
  return (
    <Dialog open={isSubflowModalOpen} onOpenChange={(open: boolean) => !open && closeSubflowModal()}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-slate-800">
            Edit Sub-workflow: {subflowNode?.data.title || 'Unknown'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200">
          <div className="text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-medium mb-2 text-slate-700">Sub-workflow Editor</h3>
            <p className="text-sm text-slate-500">
              This would open a nested workflow editor for the selected workflow node.
            </p>
            <p className="text-sm mt-2 text-slate-500">
              In a real implementation, this would show another ReactFlow canvas
              <br />
              with the sub-workflow's nodes and connections.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={closeSubflowModal} className="text-slate-600 border-slate-200 hover:bg-slate-50">
            Cancel
          </Button>
          <Button onClick={closeSubflowModal} className="bg-slate-800 hover:bg-slate-900 text-white">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubflowModal; 