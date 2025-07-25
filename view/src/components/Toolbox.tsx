import React from 'react';
import { installedApps } from '../data/installedApps';
import { Code2, Plus } from 'lucide-react';

const Toolbox: React.FC = () => {
  const onDragStart = (event: React.DragEvent, appId: string, toolId: string, toolName: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ appId, toolId, toolName }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragStartCode = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: 'code' }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Toolbox</h2>
      
      {/* Code Node */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Control Flow</h3>
        <div
          className="bg-purple-100 border border-purple-300 rounded-lg p-3 cursor-move hover:bg-purple-200 transition-colors"
          draggable
          onDragStart={onDragStartCode}
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-700" />
            <div>
              <div className="font-medium text-purple-900">Code Block</div>
              <div className="text-xs text-purple-700">Write custom TypeScript</div>
            </div>
          </div>
        </div>
      </div>

      {/* Installed Apps */}
      <div className="space-y-4">
        {installedApps.map((app) => (
          <div key={app.id} className="border-b border-gray-200 pb-4 last:border-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{app.icon}</span>
              <h3 className="font-medium text-gray-900">{app.name}</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">{app.description}</p>
            <div className="space-y-2">
              {app.tools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white border border-gray-300 rounded-lg p-2 cursor-move hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  draggable
                  onDragStart={(e) => onDragStart(e, app.id, tool.id, tool.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      <div className="text-xs text-gray-600 line-clamp-1">{tool.description}</div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toolbox; 