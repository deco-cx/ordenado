import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useUIStore } from '../store';
import { useWorkflowStore } from '../store';
import { generateObject } from '../lib/rpc';
import workflowSchema04 from '../schema/workflowSchema04.json';

export function ImportFromCodeModal() {
  const { isImportModalOpen, setImportModalOpen } = useUIStore();
  const { importWorkflow04, markSynced, setCodeSnapshot } = useWorkflowStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateObject({
        code: code.trim(),
        schema: workflowSchema04,
        messages: [
          {
            role: "system",
            content: "You are an expert at converting Mastra TypeScript workflow code to Ordenado DSL JSON format. Always respond with valid JSON that matches the provided schema."
          }
        ]
      });

      // The result should contain the DSL JSON
      const dslGraph = result.object || result;
      
      if (!dslGraph || !dslGraph.nodes) {
        throw new Error('Invalid DSL format returned from AI');
      }

      // Import the generated DSL into the canvas
      importWorkflow04(dslGraph);
      
      // Store the code snapshot and mark as synced
      setCodeSnapshot(code.trim());
      markSynced();

      // Close modal and reset state
      setImportModalOpen(false);
      setCode('');
      setError(null);
    } catch (err) {
      console.error('Import failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to import code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setImportModalOpen(false);
    setCode('');
    setError(null);
  };

  return (
    <Dialog open={isImportModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Import from Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col gap-4">
          <div className="text-sm text-gray-600">
            Paste your Mastra TypeScript workflow code below. The AI will analyze it and convert it to visual nodes on the canvas.
          </div>
          
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium mb-2">TypeScript Code:</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your Mastra workflow code here
export const createMyWorkflow = (env: Env) => {
  const step1 = createStep({
    id: 'step-1',
    // ... step configuration
  });
  
  return createWorkflow({
    id: 'MY_WORKFLOW',
    // ... workflow configuration  
  })
    .then(step1)
    .commit();
};"
              className="flex-1 min-h-[300px] p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!code.trim() || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Nodes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 