# Feature: Select Tools to Agent

## 🎮 Como Usar

### Modos de Interação:
- **Modo Seleção** (padrão): Click e arraste para selecionar múltiplos nodes
- **Modo Pan**: Click e arraste para mover o canvas
- **Toggle**: Use os botões no canto superior direito ou teclas de atalho

### Atalhos de Teclado:
- **S**: Ativar modo de seleção
- **V** ou **P**: Ativar modo de pan/navegação
- **Ctrl/Cmd + Click**: Adicionar/remover node da seleção

### Selecionando Tools:
1. **Modo Seleção Ativo**: Verifique se está no modo correto (botão Select destacado)
2. **Hover no Node**: Passe o mouse sobre qualquer node para ver o checkbox aparecer
3. **Click no Checkbox**: Clique no checkbox circular que aparece no canto superior esquerdo
4. **Ctrl/Cmd + Click**: Segure Ctrl (Windows/Linux) ou Cmd (Mac) e clique em nodes para seleção múltipla
5. **Seleção por Retângulo**: Clique e arraste no canvas vazio para desenhar um retângulo de seleção
6. **Menu de Seleção**: Aparece automaticamente no topo quando há nodes selecionados

### Métodos de Seleção:
- **Individual**: Click no checkbox do node
- **Múltipla com Ctrl/Cmd**: Ctrl/Cmd + Click em vários nodes
- **Área (Box Selection)**: Click e arraste para selecionar múltiplos nodes de uma vez (apenas no modo seleção)
- **Seleção Parcial**: Nodes parcialmente dentro do retângulo também são selecionados

### Navegação:
- **Scroll**: Sempre disponível para zoom in/out
- **Pan**: Ative o modo Pan (V/P) para arrastar o canvas
- **Space + Drag**: Alternativa para pan temporário em qualquer modo

### Usando o Agent Chat:
- **Edit with AI**: Modifica o workflow selecionado com ajuda da IA
- **Agent with this tools**: Cria um agente que pode executar as tools selecionadas

### Dicas:
- O checkbox fica visível permanentemente em nodes selecionados
- Click no X no menu para limpar a seleção
- Click em área vazia do canvas limpa a seleção

## Overview

Implementamos uma feature de seleção múltipla de tools no canvas com interface de chat com agente AI.

## Funcionalidades Implementadas

### 1. Seleção Múltipla de Tools
- **Checkbox de Seleção**: Cada node no canvas tem um checkbox sutil que aparece ao hover
- **Visual Feedback**: Nodes selecionados ganham um anel azul (ring-2 ring-blue-400)
- **Estado Persistente**: Seleção é mantida no UIStore com Set<string> de IDs

### 2. Menu Contextual Flutuante
- **Posicionamento Inteligente**: Aparece acima dos nodes selecionados, centralizado
- **Duas Opções**:
  - "Edit with AI" - Para editar o fluxo selecionado
  - "Agent with this tools" - Para criar um agente com as tools selecionadas

### 3. Interface de Chat com Agente

#### Modo "Edit with AI"
- **Avatar**: Ícone de edição com fundo roxo
- **Capacidades**:
  - Modificar parâmetros de entrada
  - Adicionar transformações entre tools
  - Otimizar estrutura do workflow
  - Adicionar error handling

#### Modo "Agent with this tools"
- **Avatar**: Ícone de bot com fundo azul
- **Capacidades**:
  - Executar tools em sequência ou paralelo
  - Transformar dados entre chamadas
  - Tomar decisões baseadas em outputs
  - Lidar com tarefas complexas

### 4. Features da Interface de Chat

#### Visual
- **Display de Tools Selecionadas**: Pills com ícone e nome de cada tool
- **Mensagens Estilizadas**: 
  - Usuário: Fundo azul, alinhado à direita
  - Assistente: Fundo cinza, alinhado à esquerda
- **Typing Indicator**: Três bolinhas animadas com bounce
- **Timestamps**: Em cada mensagem

#### Interações
- **Action Buttons**: Botões contextuais em mensagens do assistente
  - Edit: Aplicar mudanças sugeridas
  - Execute: Executar workflow
  - Suggest: Ver alternativas
- **Indicadores de Status**: Context-aware suggestions, Real-time execution

### 5. Implementação Técnica

#### Store (UIStore)
```typescript
selectedNodeIds: Set<string>
toggleNodeSelection: (nodeId: string) => void
selectNodes: (nodeIds: string[]) => void
clearSelection: () => void
isAgentChatOpen: boolean
agentMode: 'edit' | 'agent' | null
openAgentChat: (mode: 'edit' | 'agent') => void
closeAgentChat: () => void
```

#### Componentes
- **Canvas.tsx**: Atualizado com checkboxes e SelectionMenu
- **AgentChatModal.tsx**: Novo componente com toda interface de chat
- **App.tsx**: Renderiza o AgentChatModal

#### Estilos
- Animações CSS customizadas para typing indicator
- Tailwind classes para visual consistency

## Mock Data

Como é um app conceito, todas as respostas são mockadas:
- Mensagens pré-definidas baseadas no contexto
- Delays simulados para parecer processamento real
- Diferentes respostas para cada modo (edit vs agent)

## UX Highlights

1. **Descoberta Gradual**: Checkboxes aparecem apenas no hover
2. **Feedback Visual Claro**: Ring azul para seleção
3. **Contexto Preservado**: Modal mostra tools selecionadas
4. **Interações Ricas**: Action buttons para simular capacidades reais
5. **Design Moderno**: Interface limpa com ícones e cores consistentes
