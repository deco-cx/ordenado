import React, { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useWorkflowStore } from '../store';
import type { Env as DecoEnv } from '../../../server/deco.gen.ts';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure TypeScript compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    // Add common type definitions for Mastra and Deco
    const mastraTypes = `
declare module "@deco/workers-runtime/mastra" {
  export function createStep(config: any): any;
  export function createWorkflow(config: any): any;
  export function createTool(config: any): any;
}

declare module "zod" {
  export const z: any;
}

// Env type based on deco.gen.ts structure
interface Env extends Record<string, any> {
  DECO_CHAT_WORKSPACE_API: {
    AI_GENERATE_OBJECT: (input: {
      messages: Array<{ role: string; content: string }>;
      schema: any;
      model?: string;
      temperature?: number;
    }) => Promise<{ object?: any; [key: string]: any }>;
    DATABASES_RUN_SQL: (input: {
      sql: string;
      params?: any[];
    }) => Promise<{ results?: any[]; [key: string]: any }>;
    [toolName: string]: (input: any) => Promise<any>;
  };
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}
`;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      mastraTypes,
      'mastra-types.d.ts'
    );
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="w-full h-full min-h-[400px] border rounded-lg overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          readOnly,
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          glyphMargin: false,
          contextmenu: true,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          renderWhitespace: 'none',
          renderControlCharacters: false,
          renderLineHighlight: 'line',
          scrollbar: {
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
        }}
      />
    </div>
  );
}

export function CodeMode() {
  const { codeSnapshot, setCodeSnapshot } = useWorkflowStore();
  
  const handleCodeChange = (newCode: string) => {
    setCodeSnapshot(newCode);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <CodeEditor
          value={codeSnapshot || '// Paste your Mastra workflow code here\n'}
          onChange={handleCodeChange}
        />
      </div>
    </div>
  );
} 