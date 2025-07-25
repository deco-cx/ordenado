import React from 'react';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import RunModal from './components/RunModal';
import SubflowModal from './components/SubflowModal';
import { Button } from './components/ui/button';
import { useWorkflowStore, useUIStore } from './store';
import { Play, Download, Upload, FileJson } from 'lucide-react';

function App() {
  const { exportWorkflow, importWorkflow } = useWorkflowStore();
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
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FlowForge α
            </h1>
            <span className="text-sm text-gray-500">AI-Assisted Workflow Builder</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setRunModalOpen(true)}>
              <Play className="w-4 h-4 mr-2" />
              Run Workflow
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <Toolbox />
        <Canvas />
        <Inspector />
      </div>
      
      {/* Modals */}
      <RunModal />
      <SubflowModal />
    </div>
  );
}

export default App; 