import React from 'react';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import RunModal from './components/RunModal';
import SubflowModal from './components/SubflowModal';
import { ImportFromCodeModal } from './components/ImportFromCodeModal';
import { TopbarModeToggle } from './components/TopbarModeToggle';
import { CodeMode } from './components/CodeEditor';
import { Button } from './components/ui/button';
import { useWorkflowStore, useUIStore } from './store';
import { Play, Download, Upload } from 'lucide-react';

function App() {
  const { exportWorkflow, importWorkflow, codeMode } = useWorkflowStore();
  const { setRunModalOpen } = useUIStore();
  
  const handleExport = () => {
    const workflow = exportWorkflow();
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const workflow = JSON.parse(text);
        importWorkflow(workflow);
      } catch (error) {
        console.error('Failed to import workflow:', error);
        alert('Failed to import workflow. Please check the file format.');
      }
    };
    input.click();
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-medium text-slate-800">
                Ordenado
              </h1>
              <span className="text-sm text-slate-500 font-normal">Visual Workflow Builder</span>
            </div>
            
            {/* Mode Toggle */}
            <TopbarModeToggle />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImport} className="text-slate-600 border-slate-300 hover:bg-slate-50">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="text-slate-600 border-slate-300 hover:bg-slate-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setRunModalOpen(true)} className="bg-slate-800 hover:bg-slate-900 text-white">
              <Play className="w-4 h-4 mr-2" />
              Run Workflow
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {codeMode ? (
          // Code Mode Layout
          <div className="flex-1 flex">
            <div className="flex-1 p-4">
              <CodeMode />
            </div>
            <Inspector />
          </div>
        ) : (
          // Canvas Mode Layout  
          <>
            <Toolbox />
            <Canvas />
            <Inspector />
          </>
        )}
      </div>
      
      {/* Modals */}
      <RunModal />
      <SubflowModal />
      <ImportFromCodeModal />
    </div>
  );
}

export default App; 