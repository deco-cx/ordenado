import React, { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Code2, GitBranch, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../store';
import { useUIStore } from '../store';
import { generateObject } from '../lib/rpc';
import workflowSchema04 from '../schema/workflowSchema04.json';

export function TopbarModeToggle() {
  const { 
    codeMode, 
    setCodeMode, 
    isUnsynced, 
    codeSnapshot, 
    exportWorkflow04, 
    importWorkflow04, 
    setCodeSnapshot, 
    markSynced 
  } = useWorkflowStore();
  const { setImportModalOpen } = useUIStore();
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleModeChange = (mode: string) => {
    const isCodeMode = mode === 'code';
    setCodeMode(isCodeMode);
  };

  const handleImportFromCode = () => {
    setImportModalOpen(true);
  };

  const handleSync = async () => {
    if (!isUnsynced) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const currentGraph = exportWorkflow04();
      
      if (codeSnapshot) {
        // Code has changed - sync from code to graph
        const result = await generateObject({
          code: codeSnapshot,
          schema: workflowSchema04,
          messages: [
            {
              role: "system",
              content: "Convert the provided Mastra TypeScript code to DSL JSON format. Respond with valid JSON only."
            }
          ]
        });

        const dslGraph = result.object || result;
        if (!dslGraph || !dslGraph.nodes) {
          throw new Error('Invalid DSL format returned from AI');
        }

        importWorkflow04(dslGraph);
      } else {
        // Graph has changed - sync from graph to code
        const result = await generateObject({
          graph: currentGraph,
          schema: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "Generated TypeScript code for the Mastra workflow"
              }
            },
            required: ["code"]
          },
          messages: [
            {
              role: "system", 
              content: "Convert the provided DSL JSON to clean Mastra TypeScript workflow code. Follow best practices and proper formatting."
            }
          ]
        });

        const generatedCode = result.object?.code || result.code;
        if (!generatedCode) {
          throw new Error('No code generated from AI');
        }

        setCodeSnapshot(generatedCode);
      }

      markSynced();
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncError(err instanceof Error ? err.message : 'Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Tabs value={codeMode ? 'code' : 'canvas'} onValueChange={handleModeChange} className="w-auto">
        <TabsList className="grid w-fit grid-cols-2">
          <TabsTrigger value="canvas" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Canvas
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Code
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {codeMode && (
        <div className="flex items-center gap-2">
          {!codeSnapshot && (
            <Button
              onClick={handleImportFromCode}
              size="sm"
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Import from Code
            </Button>
          )}
          
          {isUnsynced && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                Unsynced changes
              </div>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <GitBranch className="w-4 h-4" />
                    Sync
                  </>
                )}
              </Button>
            </div>
          )}
          
          {syncError && (
            <div className="text-sm text-red-600 max-w-xs truncate" title={syncError}>
              Sync failed: {syncError}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 