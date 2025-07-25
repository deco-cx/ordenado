# Sistema de Data Binding para Ordenado

## Visão Geral

Implementar um sistema robusto de binding de dados que permita referenciar outputs de nodes anteriores como inputs de nodes subsequentes, com visualização em tempo real e uma UI intuitiva.

## Conceitos Fundamentais

### 1. **Data References (Referências de Dados)**
```typescript
// Sintaxe proposta para referências
$NodeName.path.to.value
$NodeName.array[0].property
$NodeName.array.map(item => item.name).join(', ')
$NodeName.array.filter(item => item.active).length
```

### 2. **Execution Context**
Cada node tem acesso ao contexto de execução contendo outputs de todos os nodes anteriores:
```typescript
interface ExecutionContext {
  [nodeId: string]: {
    title: string;
    output: unknown;
    executedAt: number;
  }
}
```

## Arquitetura Proposta

### 1. **Sistema de Expressões**

#### Parser de Expressões
```typescript
interface Expression {
  type: 'reference' | 'literal' | 'function' | 'accessor';
  value: string;
  path?: string[];
  args?: Expression[];
}

// Exemplos parseados:
// $TeamList.teams[0].name
{
  type: 'reference',
  value: 'TeamList',
  path: ['teams', '0', 'name']
}

// $TeamList.teams.map(t => t.name).join(', ')
{
  type: 'function',
  value: 'join',
  args: [{ type: 'literal', value: ', ' }],
  source: {
    type: 'function',
    value: 'map',
    args: [/* lambda expression */]
  }
}
```

#### Evaluator
```typescript
class ExpressionEvaluator {
  evaluate(
    expression: Expression, 
    context: ExecutionContext
  ): unknown {
    // Resolve referências e execute funções
  }
  
  // Suporte para funções comuns
  functions = {
    map: (arr, fn) => arr.map(fn),
    filter: (arr, fn) => arr.filter(fn),
    join: (arr, sep) => arr.join(sep),
    length: (arr) => arr.length,
    sum: (arr) => arr.reduce((a, b) => a + b, 0),
    // ... mais funções úteis
  }
}
```

### 2. **UI Components**

#### Input Field Inteligente
```typescript
interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  context: ExecutionContext;
  currentNodeId: string;
}

// Features:
// - Autocomplete ao digitar $
// - Preview do valor resolvido
// - Syntax highlighting
// - Validação em tempo real
```

#### Data Explorer Panel
```typescript
interface DataExplorerProps {
  context: ExecutionContext;
  onSelect: (expression: string) => void;
}

// Features:
// - Árvore navegável de todos os outputs
// - Preview de valores
// - Geração de expressões ao clicar
// - Busca fuzzy
```

## UI/UX Design

### 1. **Input Enhancement**

```
┌─────────────────────────────────────────┐
│ Prompt:                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Summarize teams: $TeamList.teams... │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Preview: "Summarize teams: Team A, T..." │
│                                         │
│ [📊 Browse Data] [⚡ Insert Variable]   │
└─────────────────────────────────────────┘
```

### 2. **Autocomplete Dropdown**

```
$Team|
┌─────────────────────────────────────────┐
│ 💡 Available References                 │
├─────────────────────────────────────────┤
│ $TeamList.teams                         │
│   → [{name: "Team A", id: 1}, ...]     │
│                                         │
│ $TeamList.teams[0].name                 │
│   → "Team A"                           │
│                                         │
│ $TeamList.teams.map(t => t.name)       │
│   → ["Team A", "Team B"]               │
└─────────────────────────────────────────┘
```

### 3. **Data Explorer Modal**

```
┌─────────────────────────────────────────┐
│ 🔍 Data Explorer                    [X] │
├─────────────────────────────────────────┤
│ Search: [_______________]               │
│                                         │
│ ▼ TeamList (executed 2min ago)         │
│   ▼ teams: Array(3)                    │
│     ▼ [0]                              │
│       • name: "Team A" [Copy Path]     │
│       • id: 1          [Copy Path]     │
│     ▼ [1]                              │
│       • name: "Team B" [Copy Path]     │
│       • id: 2          [Copy Path]     │
│                                         │
│ ▼ GetUserInfo (executed 3min ago)      │
│   • email: "user@example.com"          │
│   • role: "admin"                      │
└─────────────────────────────────────────┘
```

### 4. **Visual Indicators no Canvas**

```
┌─────────────┐      ┌─────────────┐
│  TeamList   │ ───→ │   AI Call   │
│  ✓ Cached   │      │ 🔗 Uses data│
└─────────────┘      └─────────────┘
                           ↓
                     Shows dependency
```

## Implementação por Fases

### Fase 1: Infraestrutura Base
1. **ExecutionContext no Store**
   - Armazenar outputs com metadata
   - Manter ordem de execução
   - Cache persistente

2. **Parser de Expressões Simples**
   - Suporte para paths básicos: `$Node.path.to.value`
   - Validação de sintaxe
   - Resolução de valores

### Fase 2: UI Básica
1. **SmartInput Component**
   - Detecção de $ para ativar modo binding
   - Preview inline do valor resolvido
   - Highlight de expressões válidas/inválidas

2. **Integração no Inspector**
   - Substituir inputs normais por SmartInputs
   - Mostrar dependências do node

### Fase 3: Features Avançadas
1. **Funções de Transformação**
   - map, filter, reduce, join
   - Funções customizadas
   - Type safety

2. **Data Explorer**
   - Modal/Panel navegável
   - Geração de expressões por clique
   - Copy to clipboard

3. **Visual Feedback**
   - Linhas de dependência no canvas
   - Badges indicando uso de dados
   - Preview on hover

### Fase 4: Developer Experience
1. **IntelliSense**
   - Autocomplete context-aware
   - Documentação inline
   - Quick fixes

2. **Debugging Tools**
   - Step-through de expressões
   - Watch panel para valores
   - Histórico de execução

## Exemplos de Uso

### 1. Concatenação Simples
```typescript
// Input do node AI
{
  prompt: "Summarize the following teams: $TeamList.teams.map(t => t.name).join(', ')"
}
// Resultado: "Summarize the following teams: Team A, Team B, Team C"
```

### 2. Acesso a Array Específico
```typescript
// Input do node EmailSender
{
  to: "$GetManagers.users[0].email",
  subject: "Report for $TeamList.teams[0].name"
}
```

### 3. Computações Complexas
```typescript
// Input do node DataProcessor
{
  totalUsers: "$UserList.users.length",
  activeUsers: "$UserList.users.filter(u => u.status === 'active').length",
  completion: "$TaskList.tasks.filter(t => t.done).length / $TaskList.tasks.length * 100"
}
```

## Considerações Técnicas

### 1. **Performance**
- Cache de expressões parseadas
- Lazy evaluation onde possível
- Debounce em previews durante digitação

### 2. **Segurança**
- Sandboxing de expressões
- Prevenir acesso a globals
- Validação de tipos em runtime

### 3. **Compatibilidade**
- Fallback para valores literais
- Migração suave de workflows existentes
- Export/import mantém bindings

### 4. **Extensibilidade**
- Plugin system para funções customizadas
- Adaptadores para diferentes tipos de dados
- Hooks para validação customizada

## Mockups de Código

### Store Extension
```typescript
interface WorkflowStore {
  // ... existing
  executionContext: ExecutionContext;
  
  // New methods
  evaluateExpression: (expression: string, currentNodeId: string) => unknown;
  getAvailableReferences: (currentNodeId: string) => Reference[];
  updateNodeInputWithBinding: (nodeId: string, field: string, expression: string) => void;
}
```

### SmartInput Component
```typescript
const SmartInput: React.FC<SmartInputProps> = ({ 
  value, 
  onChange, 
  context,
  field 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [isValid, setIsValid] = useState(true);
  
  // Detect $ and show autocomplete
  // Evaluate and preview in real-time
  // Syntax highlighting with monaco-editor lite
  
  return (
    <div className="relative">
      <MonacoEditorLite
        value={value}
        onChange={handleChange}
        language="ordenado-expression"
        theme="ordenado-light"
      />
      {preview && (
        <div className="text-xs text-slate-500 mt-1">
          Preview: {preview}
        </div>
      )}
      {showSuggestions && <AutocompleteSuggestions />}
    </div>
  );
};
```

## Benefícios

1. **Produtividade**: Menos erros, mais rápido construir workflows
2. **Poder**: Transformações complexas sem código
3. **Visualização**: Sempre sabe o que está acontecendo
4. **Debugging**: Fácil identificar problemas
5. **Reusabilidade**: Patterns podem ser salvos e compartilhados

## Casos de Uso Específicos do Deco

### 1. **Airtable Integration**
```typescript
// Buscar records e criar tasks
{
  // Node 1: AIRTABLE_LIST_RECORDS
  filter: "Status = 'Pending'"
}

// Node 2: CREATE_TASKS (usando dados do Airtable)
{
  tasks: "$AirtableRecords.records.map(r => ({ 
    title: r.fields.Title,
    assignee: r.fields.AssignedTo,
    dueDate: r.fields.DueDate,
    airtableId: r.id
  }))"
}
```

### 2. **Knowledge Base + AI**
```typescript
// Node 1: KNOWLEDGE_SEARCH
{
  query: "company policies"
}

// Node 2: AI_GENERATE
{
  prompt: "Based on these policies: $KnowledgeSearch.results.map(r => r.content).join('\\n\\n'), answer: ...",
  context: "$KnowledgeSearch.results[0].metadata"
}
```

### 3. **Database Operations**
```typescript
// Node 1: DATABASES_RUN_SQL
{
  sql: "SELECT * FROM users WHERE role = 'manager'"
}

// Node 2: SEND_EMAIL (batch)
{
  recipients: "$DatabaseQuery.results.map(u => u.email)",
  personalizedSubject: "$DatabaseQuery.results.map(u => `Hi ${u.name}, ...`)"
}
```

## Tratamento de Tipos TypeScript

### Schema de Tipos para Nodes
```typescript
interface NodeOutputSchema {
  [nodeTitle: string]: {
    schema: JsonSchema;
    sample?: unknown; // Sample data para preview
  }
}

// Gerar tipos dinamicamente
type InferredType<T extends JsonSchema> = /* ... */

// Validação em runtime com Zod
const validateExpression = (
  expression: string,
  expectedType: JsonSchema,
  actualValue: unknown
): ValidationResult => {
  // ...
}
```

### Monaco Editor Integration
```typescript
// Custom Language Service
monaco.languages.registerCompletionItemProvider('ordenado-expression', {
  provideCompletionItems: (model, position) => {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });
    
    if (textUntilPosition.includes('$')) {
      return {
        suggestions: getAvailableReferences().map(ref => ({
          label: ref.path,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: ref.path,
          detail: ref.type,
          documentation: JSON.stringify(ref.preview)
        }))
      };
    }
  }
});
```

## Edge Cases e Tratamento de Erros

### 1. **Referências Circulares**
```typescript
// Detectar e prevenir
if (hasCircularDependency(nodeId, expression)) {
  throw new Error('Circular reference detected');
}
```

### 2. **Nodes Não Executados**
```typescript
// UI indica claramente
$UnexecutedNode.value // ⚠️ Node not yet executed
```

### 3. **Valores Null/Undefined**
```typescript
// Safe navigation
$Node.data?.user?.email || 'default@example.com'
$Node.array?.[0]?.name ?? 'Unknown'
```

### 4. **Arrays Vazios**
```typescript
// Feedback visual
$EmptyList.items.map(...) // ⚠️ Empty array - will return []
```

## Próximos Passos

1. Validar conceitos com protótipo
2. Definir grammar formal para expressões
3. Design detalhado dos componentes UI
4. Implementar parser e evaluator
5. Integrar com sistema existente
6. Criar testes E2E para casos complexos
7. Documentação e exemplos interativos
