import type { Expression, ExecutionContext, BindingValidation, DataReference } from '../types';

export class ExpressionParser {
  // Parse expression like $NodeName.path.to.value or $NodeName.array[0].property
  parse(expression: string): Expression | null {
    if (!expression.startsWith('$')) {
      return {
        type: 'literal',
        value: expression
      };
    }

    // Basic regex to match $NodeName.path patterns
    const match = expression.match(/^\$([a-zA-Z0-9_]+)(\..*)?$/);
    if (!match) {
      return null;
    }

    const nodeName = match[1];
    const pathStr = match[2];

    if (!pathStr) {
      return {
        type: 'reference',
        value: nodeName,
        path: []
      };
    }

    // Parse path (supports dot notation and array indices)
    const path = this.parsePath(pathStr.substring(1)); // Remove leading dot
    
    return {
      type: 'reference',
      value: nodeName,
      path
    };
  }

  private parsePath(pathStr: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inBracket = false;

    for (let i = 0; i < pathStr.length; i++) {
      const char = pathStr[i];
      
      if (char === '[') {
        if (current) {
          parts.push(current);
          current = '';
        }
        inBracket = true;
      } else if (char === ']') {
        if (inBracket && current) {
          parts.push(current);
          current = '';
        }
        inBracket = false;
      } else if (char === '.' && !inBracket) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }
}

export class ExpressionEvaluator {
  private parser = new ExpressionParser();

  evaluate(expression: string, context: ExecutionContext, currentNodeId: string): BindingValidation {
    try {
      const parsed = this.parser.parse(expression);
      if (!parsed) {
        return {
          isValid: false,
          error: 'Invalid expression syntax'
        };
      }

      if (parsed.type === 'literal') {
        return {
          isValid: true,
          resolvedValue: parsed.value
        };
      }

      if (parsed.type === 'reference') {
        return this.evaluateReference(parsed, context, currentNodeId);
      }

      return {
        isValid: false,
        error: 'Unsupported expression type'
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private evaluateReference(expr: Expression, context: ExecutionContext, currentNodeId: string): BindingValidation {
    // Find node by title
    const nodeEntry = Object.entries(context).find(
      ([_, data]) => data.nodeTitle === expr.value
    );

    if (!nodeEntry) {
      return {
        isValid: false,
        error: `Node "${expr.value}" not found or not executed yet`
      };
    }

    const [nodeId, nodeData] = nodeEntry;

    // Check if node was executed successfully
    if (nodeData.status === 'error') {
      return {
        isValid: false,
        error: `Node "${expr.value}" failed with error: ${nodeData.error}`
      };
    }

    // Check for circular dependency
    if (nodeId === currentNodeId) {
      return {
        isValid: false,
        error: 'Circular reference detected'
      };
    }

    // Resolve path
    let value = nodeData.output;
    const path = expr.path || [];

    for (const segment of path) {
      if (value === null || value === undefined) {
        return {
          isValid: false,
          error: `Cannot access property "${segment}" of null/undefined`
        };
      }

      if (typeof value === 'object' && segment in value) {
        value = (value as any)[segment];
      } else {
        return {
          isValid: false,
          error: `Property "${segment}" not found in ${expr.value}`
        };
      }
    }

    return {
      isValid: true,
      resolvedValue: value,
      usedReferences: [expr.value]
    };
  }

  // Get all available references for autocomplete
  getAvailableReferences(context: ExecutionContext, currentNodeId: string): DataReference[] {
    const references: DataReference[] = [];

    Object.entries(context).forEach(([nodeId, data]) => {
      if (nodeId !== currentNodeId && data.status === 'success') {
        // Add base reference
        references.push({
          nodeId,
          nodeTitle: data.nodeTitle,
          path: `$${data.nodeTitle}`,
          value: data.output,
          type: this.getType(data.output)
        });

        // Add nested references for objects and arrays
        this.extractNestedReferences(
          data.output,
          `$${data.nodeTitle}`,
          nodeId,
          data.nodeTitle,
          references
        );
      }
    });

    return references;
  }

  private extractNestedReferences(
    obj: unknown,
    basePath: string,
    nodeId: string,
    nodeTitle: string,
    references: DataReference[],
    depth = 0
  ): void {
    if (depth > 3) return; // Limit depth to prevent too many suggestions

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const path = `${basePath}[${index}]`;
        references.push({
          nodeId,
          nodeTitle,
          path,
          value: item,
          type: this.getType(item)
        });

        if (typeof item === 'object' && item !== null) {
          this.extractNestedReferences(item, path, nodeId, nodeTitle, references, depth + 1);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const path = `${basePath}.${key}`;
        references.push({
          nodeId,
          nodeTitle,
          path,
          value,
          type: this.getType(value)
        });

        if (typeof value === 'object' && value !== null) {
          this.extractNestedReferences(value, path, nodeId, nodeTitle, references, depth + 1);
        }
      });
    }
  }

  private getType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  // Check if an expression contains references
  containsReferences(expression: string): boolean {
    return expression.includes('$');
  }

  // Replace all references in a string with their resolved values
  interpolate(template: string, context: ExecutionContext, currentNodeId: string): string {
    // Find all $NodeName.path patterns
    const regex = /\$[a-zA-Z0-9_]+(\.[a-zA-Z0-9_\[\]\.]+)?/g;
    
    return template.replace(regex, (match) => {
      const result = this.evaluate(match, context, currentNodeId);
      if (result.isValid && result.resolvedValue !== undefined) {
        // Convert value to string representation
        if (typeof result.resolvedValue === 'object') {
          return JSON.stringify(result.resolvedValue);
        }
        return String(result.resolvedValue);
      }
      return match; // Keep original if evaluation fails
    });
  }
} 