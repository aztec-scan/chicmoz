import { type FC, useState } from "react";

interface JsonDisplayProps {
  data: unknown;
  maxDepth?: number;
  initialDepth?: number;
}

// Function to determine if a value is an object or array and has properties
const hasChildren = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  return Object.keys(value).length > 0;
};

// Function to format primitive values with syntax highlighting
const formatValue = (value: unknown): JSX.Element => {
  if (value === null) return <span className="text-gray-500 dark:text-gray-400">null</span>;
  if (value === undefined) return <span className="text-gray-500 dark:text-gray-400">undefined</span>;
  
  switch (typeof value) {
    case 'boolean':
      return <span className="text-purple-600 dark:text-purple-400">{value.toString()}</span>;
    case 'number':
      return <span className="text-blue-600 dark:text-blue-400">{value.toString()}</span>;
    case 'string':
      return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    default:
      return <span className="dark:text-gray-100">{String(value)}</span>;
  }
};

export const JsonDisplay: FC<JsonDisplayProps> = ({ 
  data, 
  maxDepth = 20, 
  initialDepth = 0 
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});

  const togglePath = (path: string) => {
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const isExpanded = (path: string): boolean => {
    return expandedPaths[path] ?? (initialDepth > 0);
  };

  const renderNode = (value: unknown, path: string, depth: number): JSX.Element => {
    // Render primitive values directly
    if (!hasChildren(value)) {
      return formatValue(value);
    }

    // Don't go deeper than maxDepth
    if (depth >= maxDepth) {
      return <span className="text-gray-500">[Complex Object]</span>;
    }

    // Handle objects and arrays
    const isArray = Array.isArray(value);
    const keys = Object.keys(value as object);
    const isEmpty = keys.length === 0;
    
    if (isEmpty) {
      return <span>{isArray ? "[]" : "{}"}</span>;
    }

    const expanded = isExpanded(path);
    
    // Try to find a name for the object
    const getObjectName = (obj: any): string => {
      if (obj.name) return obj.name;
      if (obj.functionName) return obj.functionName;
      if (obj.title) return obj.title;
      if (obj.id) return obj.id;
      return "Object";
    };

    const objectName = isArray ? "Array" : getObjectName(value);
    
    return (
      <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded" 
          onClick={() => togglePath(path)}
        >
          <span className="mr-2 text-blue-500 dark:text-blue-400">{expanded ? "▼" : "▶"}</span>
          <span className="font-mono dark:text-gray-200">
            {isArray 
              ? `Array(${keys.length})` 
              : `${objectName} {${keys.length} ${keys.length === 1 ? "property" : "properties"}}`
            }
          </span>
        </div>
        
        {expanded && (
          <div className="pl-4">
            {keys.map((key, index) => {
              const childPath = `${path}.${key}`;
              const childValue = (value as Record<string, unknown>)[key];
              
              return (
                <div key={childPath} className="py-1">
                  <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                    {isArray ? index : key}:
                  </span>{" "}
                  {renderNode(childValue, childPath, depth + 1)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="overflow-auto font-mono text-sm">
      {renderNode(data, "root", 0)}
    </div>
  );
};
