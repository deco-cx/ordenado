import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useWorkflowStore } from '../store';
import type { DataReference } from '../types';
import { ChevronRight, Database, Hash, List, Type, Braces } from 'lucide-react';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  currentNodeId: string;
  className?: string;
}

const SmartInput: React.FC<SmartInputProps> = ({
  value,
  onChange,
  placeholder,
  currentNodeId,
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { evaluateExpression, getAvailableReferences } = useWorkflowStore();

  // Get available references
  const references = useMemo(
    () => getAvailableReferences(currentNodeId),
    [currentNodeId, getAvailableReferences]
  );

  // Evaluate current expression for preview
  const evaluation = useMemo(() => {
    if (!value || !value.includes('$')) return null;
    return evaluateExpression(value, currentNodeId);
  }, [value, currentNodeId, evaluateExpression]);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    if (!showSuggestions) return [];

    // Find the current $ expression being typed
    const beforeCursor = value.substring(0, cursorPosition);
    const lastDollarIndex = beforeCursor.lastIndexOf('$');
    
    if (lastDollarIndex === -1) return [];

    const currentExpression = beforeCursor.substring(lastDollarIndex);
    const searchTerm = currentExpression.substring(1).toLowerCase(); // Remove $

    return references.filter(ref =>
      ref.nodeTitle.toLowerCase().includes(searchTerm) ||
      ref.path.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 suggestions
  }, [showSuggestions, value, cursorPosition, references]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);

    // Show suggestions when typing $
    const beforeCursor = newValue.substring(0, newCursorPos);
    setShowSuggestions(beforeCursor.includes('$') && beforeCursor.lastIndexOf('$') >= beforeCursor.length - 20);
    setSelectedIndex(0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[selectedIndex]) {
          insertSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Insert selected suggestion
  const insertSuggestion = (suggestion: DataReference) => {
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const lastDollarIndex = beforeCursor.lastIndexOf('$');
    
    if (lastDollarIndex !== -1) {
      const newValue = 
        value.substring(0, lastDollarIndex) +
        suggestion.path +
        afterCursor;
      
      onChange(newValue);
      setShowSuggestions(false);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = lastDollarIndex + suggestion.path.length;
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for data type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'array':
        return <List className="w-3 h-3" />;
      case 'object':
        return <Braces className="w-3 h-3" />;
      case 'string':
        return <Type className="w-3 h-3" />;
      case 'number':
        return <Hash className="w-3 h-3" />;
      default:
        return <Database className="w-3 h-3" />;
    }
  };

  // Format preview value
  const formatPreview = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      const str = JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    }
    return String(value);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={(e) => setCursorPosition(e.target.selectionStart || 0)}
        onClick={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
          evaluation && !evaluation.isValid
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400'
            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400'
        } ${className}`}
      />

      {/* Preview or error */}
      {evaluation && (
        <div className={`text-xs mt-1 ${
          evaluation.isValid ? 'text-slate-500' : 'text-rose-500'
        }`}>
          {evaluation.isValid && evaluation.resolvedValue !== undefined
            ? `→ ${formatPreview(evaluation.resolvedValue)}`
            : evaluation.error
          }
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.nodeId}-${suggestion.path}`}
              className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 ${
                index === selectedIndex ? 'bg-slate-50' : ''
              }`}
              onClick={() => insertSuggestion(suggestion)}
            >
              <span className="text-slate-400">
                {getTypeIcon(suggestion.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {suggestion.path}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {formatPreview(suggestion.value)}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartInput; 