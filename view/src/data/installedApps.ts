export const installedApps = [
  {
    id: "ai-models",
    name: "AI Models",
    icon: "🤖",
    description: "LLM and AI model integrations",
    tools: [
      {
        id: "generate-text",
        name: "Generate Text",
        description: "Generate text using GPT-4",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            temperature: { type: "number", default: 0.7 },
            maxTokens: { type: "number", default: 1000 }
          },
          required: ["prompt"]
        },
        outputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
            tokens: { type: "number" }
          }
        }
      },
      {
        id: "classify-text",
        name: "Classify Text",
        description: "Classify text into categories",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string" },
            categories: { type: "array", items: { type: "string" } }
          },
          required: ["text", "categories"]
        },
        outputSchema: {
          type: "object",
          properties: {
            category: { type: "string" },
            confidence: { type: "number" }
          }
        }
      }
    ]
  },
  {
    id: "database",
    name: "Database",
    icon: "🗄️",
    description: "Database operations",
    tools: [
      {
        id: "run-sql",
        name: "Run SQL Query",
        description: "Execute SQL queries",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
            params: { type: "array", items: {} }
          },
          required: ["sql"]
        },
        outputSchema: {
          type: "object",
          properties: {
            rows: { type: "array" },
            rowCount: { type: "number" }
          }
        }
      },
      {
        id: "upsert-record",
        name: "Upsert Record",
        description: "Insert or update a record",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            data: { type: "object" },
            key: { type: "string" }
          },
          required: ["table", "data"]
        },
        outputSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            id: { type: "string" }
          }
        }
      }
    ]
  },
  {
    id: "http",
    name: "HTTP Client",
    icon: "🌐",
    description: "Make HTTP requests",
    tools: [
      {
        id: "fetch",
        name: "HTTP Request",
        description: "Make HTTP requests to any URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            method: { type: "string", default: "GET" },
            headers: { type: "object" },
            body: { type: "string" }
          },
          required: ["url"]
        },
        outputSchema: {
          type: "object",
          properties: {
            status: { type: "number" },
            body: { type: "string" },
            headers: { type: "object" }
          }
        }
      },
      {
        id: "webhook",
        name: "Send Webhook",
        description: "Send data to a webhook URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string" },
            payload: { type: "object" }
          },
          required: ["url", "payload"]
        },
        outputSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            response: { type: "object" }
          }
        }
      }
    ]
  },
  {
    id: "email",
    name: "Email Service",
    icon: "📧",
    description: "Send and manage emails",
    tools: [
      {
        id: "send-email",
        name: "Send Email",
        description: "Send an email message",
        inputSchema: {
          type: "object",
          properties: {
            to: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
            html: { type: "boolean", default: false }
          },
          required: ["to", "subject", "body"]
        },
        outputSchema: {
          type: "object",
          properties: {
            messageId: { type: "string" },
            success: { type: "boolean" }
          }
        }
      }
    ]
  },
  {
    id: "files",
    name: "File System",
    icon: "📁",
    description: "File operations",
    tools: [
      {
        id: "read-file",
        name: "Read File",
        description: "Read file contents",
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
            content: { type: "string" },
            size: { type: "number" }
          }
        }
      },
      {
        id: "write-file",
        name: "Write File",
        description: "Write content to a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
            append: { type: "boolean", default: false }
          },
          required: ["path", "content"]
        },
        outputSchema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            bytesWritten: { type: "number" }
          }
        }
      }
    ]
  },
  {
    id: "workflows",
    name: "Workflows",
    icon: "🔄",
    description: "Sub-workflow references",
    tools: [
      {
        id: "workflow:process-orders",
        name: "Process Orders Workflow",
        description: "Process incoming orders",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string" }
          },
          required: ["orderId"]
        },
        outputSchema: {
          type: "object",
          properties: {
            processed: { type: "boolean" },
            result: { type: "object" }
          }
        }
      },
      {
        id: "workflow:send-notifications",
        name: "Send Notifications Workflow",
        description: "Send multi-channel notifications",
        inputSchema: {
          type: "object",
          properties: {
            userId: { type: "string" },
            message: { type: "string" },
            channels: { type: "array", items: { type: "string" } }
          },
          required: ["userId", "message"]
        },
        outputSchema: {
          type: "object",
          properties: {
            sent: { type: "array" },
            failed: { type: "array" }
          }
        }
      }
    ]
  }
]; 