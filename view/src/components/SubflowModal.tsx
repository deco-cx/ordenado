import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useUIStore, useWorkflowStore } from '../store';
import { X } from 'lucide-react';
import type { FlowNode } from '../types';

const SubflowModal: React.FC = () => {
  const { isSubflowModalOpen, subflowNodeId, closeSubflowModal } = useUIStore();
  const { nodes } = useWorkflowStore();
  
  const subflowNode = nodes.find((n: FlowNode) => n.id === subflowNodeId);
  
  return (
    <Dialog open={isSubflowModalOpen} onOpenChange={(open: boolean) => !open && closeSubflowModal()}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Edit Sub-workflow: {subflowNode?.data.title || 'Unknown'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-medium mb-2">Sub-workflow Editor</h3>
            <p className="text-sm">
              This would open a nested workflow editor for the selected workflow node.
            </p>
            <p className="text-sm mt-2">
              In a real implementation, this would show another ReactFlow canvas
              <br />
              with the sub-workflow's nodes and connections.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={closeSubflowModal}>
            Cancel
          </Button>
          <Button onClick={closeSubflowModal}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubflowModal; 