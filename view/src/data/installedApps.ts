export const installedApps = [
  {
    id: "ai-agents",
    name: "AI & Agents",
    icon: "🤖",
    description: "AI generation and agent management tools",
    tools: [
      {
        id: "AI_GENERATE",
        name: "Generate Text",
        description: "Generate text using AI models directly without agent context (stateless)",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            model: { type: "string", default: "gpt-4" },
            temperature: { type: "number", default: 0.7 },
            maxTokens: { type: "number", default: 1000 }
          },
          required: ["prompt"]
        },
        outputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
            model: { type: "string" },
            usage: { type: "object" }
          }
        }
      },
      {
        id: "AI_GENERATE_OBJECT",
        name: "Generate Object",
        description: "Generate structured objects using AI models with JSON schema validation",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            schema: { type: "object" },
            model: { type: "string", default: "gpt-4" }
          },
          required: ["prompt", "schema"]
        },
        outputSchema: {
          type: "object",
          properties: {
            object: { type: "object" },
            valid: { type: "boolean" }
          }
        }
      },
      {
        id: "AGENTS_CREATE",
        name: "Create Agent",
        description: "Create a new AI agent with custom configuration",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            model: { type: "string" },
            systemPrompt: { type: "string" },
            tools: { type: "array", items: { type: "string" } }
          },
          required: ["name", "model"]
        },
        outputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            status: { type: "string" }
          }
        }
      },
      {
        id: "AGENTS_LIST",
        name: "List Agents",
        description: "List all agents in the workspace",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50 },
            offset: { type: "number", default: 0 }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            agents: { type: "array" },
            total: { type: "number" }
          }
        }
      }
    ]
  },
  {
    id: "database",
    name: "Database",
    icon: "🗄️",
    description: "Workspace database operations",
    tools: [
      {
        id: "DATABASES_RUN_SQL",
        name: "Run SQL Query",
        description: "Run a SQL query against the workspace database",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
            params: { type: "array", items: {}, default: [] }
          },
          required: ["sql"]
        },
        outputSchema: {
          type: "object",
          properties: {
            rows: { type: "array" },
            rowCount: { type: "number" },
            columns: { type: "array" }
          }
        }
      }
    ]
  },
  {
    id: "file-system",
    name: "File System",
    icon: "📁",
    description: "File storage and management operations",
    tools: [
      {
        id: "FS_READ",
        name: "Read File",
        description: "Get a secure temporary link to read a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
            expiresIn: { type: "number", default: 3600 }
          },
          required: ["path"]
        },
        outputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            expiresAt: { type: "string" }
          }
        }
      },
      {
        id: "FS_WRITE",
        name: "Write File",
        description: "Get a secure temporary link to upload a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
            contentType: { type: "string", default: "application/octet-stream" },
            expiresIn: { type: "number", default: 3600 }
          },
          required: ["path"]
        },
        outputSchema: {
          type: "object",
          properties: {
            uploadUrl: { type: "string" },
            expiresAt: { type: "string" }
          }
        }
      },
      {
        id: "FS_LIST",
        name: "List Files",
        description: "List files from a given bucket with optional prefix",
        inputSchema: {
          type: "object",
          properties: {
            prefix: { type: "string", default: "" },
            limit: { type: "number", default: 100 }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            files: { type: "array" },
            hasMore: { type: "boolean" }
          }
        }
      },
      {
        id: "FS_DELETE",
        name: "Delete File",
        description: "Delete a file from storage",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" }
          },
          required: ["path"]
        },
        outputSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            deleted: { type: "boolean" }
          }
        }
      }
    ]
  },
  {
    id: "integrations",
    name: "Integrations",
    icon: "🔌",
    description: "Integration management and tool calling",
    tools: [
      {
        id: "INTEGRATIONS_CALL_TOOL",
        name: "Call Integration Tool",
        description: "Call a tool from an installed integration",
        inputSchema: {
          type: "object",
          properties: {
            integrationId: { type: "string" },
            toolName: { type: "string" },
            input: { type: "object" }
          },
          required: ["integrationId", "toolName", "input"]
        },
        outputSchema: {
          type: "object",
          properties: {
            output: { type: "object" },
            success: { type: "boolean" }
          }
        }
      },
      {
        id: "INTEGRATIONS_LIST",
        name: "List Integrations",
        description: "List all installed integrations",
        inputSchema: {
          type: "object",
          properties: {
            enabled: { type: "boolean" }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            integrations: { type: "array" },
            total: { type: "number" }
          }
        }
      },
      {
        id: "DECO_INTEGRATIONS_SEARCH",
        name: "Search Integrations",
        description: "Search for integrations in marketplace and installed",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            marketplace: { type: "boolean", default: true },
            installed: { type: "boolean", default: true }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            results: { type: "array" },
            total: { type: "number" }
          }
        }
      }
    ]
  },
  {
    id: "knowledge-base",
    name: "Knowledge Base",
    icon: "🧠",
    description: "Knowledge management and search",
    tools: [
      {
        id: "KNOWLEDGE_BASE_SEARCH",
        name: "Search Knowledge",
        description: "Search the knowledge base for relevant information",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            knowledgeBaseId: { type: "string" },
            limit: { type: "number", default: 10 }
          },
          required: ["query"]
        },
        outputSchema: {
          type: "object",
          properties: {
            results: { type: "array" },
            scores: { type: "array" }
          }
        }
      },
      {
        id: "KNOWLEDGE_BASE_REMEMBER",
        name: "Remember Information",
        description: "Store information in the knowledge base",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string" },
            knowledgeBaseId: { type: "string" },
            metadata: { type: "object" }
          },
          required: ["content"]
        },
        outputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            stored: { type: "boolean" }
          }
        }
      },
      {
        id: "KNOWLEDGE_BASE_ADD_FILE",
        name: "Add File to Knowledge",
        description: "Add a file's content to the knowledge base",
        inputSchema: {
          type: "object",
          properties: {
            filePath: { type: "string" },
            knowledgeBaseId: { type: "string" },
            metadata: { type: "object" }
          },
          required: ["filePath"]
        },
        outputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            processed: { type: "boolean" }
          }
        }
      }
    ]
  },
  {
    id: "hosting",
    name: "App Hosting",
    icon: "☁️",
    description: "Deploy and manage applications",
    tools: [
      {
        id: "HOSTING_APP_DEPLOY",
        name: "Deploy App",
        description: "Deploy TypeScript files to Cloudflare Workers",
        inputSchema: {
          type: "object",
          properties: {
            files: { type: "object" },
            packageJson: { type: "object" },
            wranglerConfig: { type: "object" }
          },
          required: ["files", "packageJson"]
        },
        outputSchema: {
          type: "object",
          properties: {
            appId: { type: "string" },
            endpoint: { type: "string" },
            deployed: { type: "boolean" }
          }
        }
      },
      {
        id: "HOSTING_APPS_LIST",
        name: "List Apps",
        description: "List all deployed applications",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string" }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            apps: { type: "array" },
            total: { type: "number" }
          }
        }
      },
      {
        id: "HOSTING_APP_INFO",
        name: "Get App Info",
        description: "Get information about a deployed app",
        inputSchema: {
          type: "object",
          properties: {
            appId: { type: "string" }
          },
          required: ["appId"]
        },
        outputSchema: {
          type: "object",
          properties: {
            app: { type: "object" },
            endpoint: { type: "string" },
            status: { type: "string" }
          }
        }
      }
    ]
  },
  {
    id: "teams",
    name: "Team Management",
    icon: "👥",
    description: "Manage teams and collaborators",
    tools: [
      {
        id: "TEAMS_LIST",
        name: "List Teams",
        description: "List all teams for the current user",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", default: 50 }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            teams: { type: "array" },
            total: { type: "number" }
          }
        }
      },
      {
        id: "TEAM_MEMBERS_INVITE",
        name: "Invite Team Member",
        description: "Invite users to join a team via email",
        inputSchema: {
          type: "object",
          properties: {
            teamId: { type: "string" },
            emails: { type: "array", items: { type: "string" } },
            role: { type: "object", default: { id: 1, name: "owner" } }
          },
          required: ["teamId", "emails"]
        },
        outputSchema: {
          type: "object",
          properties: {
            invites: { type: "array" },
            sent: { type: "number" }
          }
        }
      },
      {
        id: "TEAM_MEMBERS_GET",
        name: "Get Team Members",
        description: "Get all members of a team",
        inputSchema: {
          type: "object",
          properties: {
            teamId: { type: "string" }
          },
          required: ["teamId"]
        },
        outputSchema: {
          type: "object",
          properties: {
            members: { type: "array" },
            total: { type: "number" }
          }
        }
      }
    ]
  },
  {
    id: "triggers",
    name: "Triggers & Automation",
    icon: "⚡",
    description: "Create webhooks and cron triggers",
    tools: [
      {
        id: "TRIGGERS_CREATE_WEBHOOK",
        name: "Create Webhook",
        description: "Create a webhook trigger for external events",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            workflowId: { type: "string" },
            secret: { type: "string" }
          },
          required: ["name", "workflowId"]
        },
        outputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            url: { type: "string" },
            secret: { type: "string" }
          }
        }
      },
      {
        id: "TRIGGERS_CREATE_CRON",
        name: "Create Cron Trigger",
        description: "Create a scheduled cron trigger",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            schedule: { type: "string" },
            workflowId: { type: "string" },
            timezone: { type: "string", default: "UTC" }
          },
          required: ["name", "schedule", "workflowId"]
        },
        outputSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            nextRun: { type: "string" },
            active: { type: "boolean" }
          }
        }
      },
      {
        id: "TRIGGERS_LIST",
        name: "List Triggers",
        description: "List all triggers in the workspace",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string" },
            active: { type: "boolean" }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            triggers: { type: "array" },
            total: { type: "number" }
          }
        }
      }
    ]
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: "📊",
    description: "Airtable database integration",
    tools: [
      {
        id: "List_Table_Records",
        name: "List Table Records",
        description: "Fetch records from a specific Airtable table",
        inputSchema: {
          type: "object",
          properties: {
            baseId: { type: "string" },
            tableId: { type: "string" },
            maxRecords: { type: "number", default: 100 },
            sort: { type: "array" },
            filterByFormula: { type: "string" }
          },
          required: ["baseId", "tableId"]
        },
        outputSchema: {
          type: "object",
          properties: {
            records: { type: "array" },
            total: { type: "number" }
          }
        }
      }
    ]
  },
  {
    id: "custom-app",
    name: "Custom Events",
    icon: "🎯",
    description: "Custom application tools",
    tools: [
      {
        id: "EVENTS_LIST",
        name: "List Events",
        description: "Lista todos os eventos/partidas disponíveis para criação de roteiros",
        inputSchema: {
          type: "object",
          properties: {
            sport: { type: "string" },
            date: { type: "string" },
            status: { type: "string" }
          }
        },
        outputSchema: {
          type: "object",
          properties: {
            events: { type: "array" },
            total: { type: "number" }
          }
        }
      }
    ]
  }
]; 