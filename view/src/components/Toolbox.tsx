import React, { useState, useMemo } from 'react';
import { installedApps } from '../data/installedApps';
import { Code2, Plus, Search, X } from 'lucide-react';

const Toolbox: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter apps and tools based on search term
  const filteredApps = useMemo(() => {
    if (!searchTerm.trim()) {
      return installedApps;
    }

    const term = searchTerm.toLowerCase();
    
    return installedApps.map(app => {
      // Filter tools within each app
      const filteredTools = app.tools.filter(tool =>
        tool.name.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term) ||
        app.name.toLowerCase().includes(term)
      );

      // Only return app if it has matching tools or its name matches
      if (filteredTools.length > 0 || app.name.toLowerCase().includes(term)) {
        return {
          ...app,
          tools: filteredTools
        };
      }
      
      return null;
    }).filter(Boolean) as typeof installedApps;
  }, [searchTerm]);

  const onDragStart = (event: React.DragEvent, appId: string, toolId: string, toolName: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ appId, toolId, toolName }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragStartCode = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: 'code' }));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Highlight search term in text
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="w-72 bg-white border-r border-slate-200 p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-base font-medium mb-3 text-slate-800">Tools</h2>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Search Results Count */}
        {searchTerm && (
          <div className="mt-2 text-xs text-slate-500">
            {filteredApps.reduce((total, app) => total + app.tools.length, 0)} tools found
          </div>
        )}
      </div>
      
      {/* Code Node */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Control Flow</h3>
        <div
          className="bg-slate-50 border border-slate-200 rounded-lg p-3 cursor-move hover:bg-slate-100 transition-colors"
          draggable
          onDragStart={onDragStartCode}
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-slate-600" />
            <div>
              <div className="font-medium text-slate-800 text-sm">Code Block</div>
              <div className="text-xs text-slate-500">Write custom TypeScript</div>
            </div>
          </div>
        </div>
      </div>

      {/* Installed Apps */}
      {filteredApps.length > 0 ? (
        <div className="space-y-5">
          {filteredApps.map((app) => (
            <div key={app.id} className="border-b border-slate-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{app.icon}</span>
                <h3 className="font-medium text-slate-800 text-sm">
                  {highlightText(app.name, searchTerm)}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {highlightText(app.description, searchTerm)}
              </p>
              <div className="space-y-2">
                {app.tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="bg-white border border-slate-200 rounded-md p-2 cursor-move hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, app.id, tool.id, tool.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">
                          {highlightText(tool.name, searchTerm)}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {highlightText(tool.description, searchTerm)}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : searchTerm ? (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No tools found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
        </div>
      ) : null}
    </div>
  );
};

export default Toolbox; 