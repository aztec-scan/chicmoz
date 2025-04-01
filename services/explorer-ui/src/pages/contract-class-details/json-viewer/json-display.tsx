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

  const renderNode = (
    value: unknown, 
    path: string, 
    depth: number, 
    keyName?: string | number
  ): JSX.Element => {
    // Render primitive values directly
    if (!hasChildren(value)) {
      // If this is a property with a key, show the key along with the value
      if (keyName !== undefined) {
        return (
          <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
            {/* Add an invisible spacer the same width as the arrow for alignment */}
            <span className="w-5 inline-block"></span>
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 mr-1">
              {keyName}:
            </span>
            {formatValue(value)}
          </div>
        );
      }
      return formatValue(value);
    }

    // Don't go deeper than maxDepth
    if (depth >= maxDepth) {
      return <span className="text-gray-500 dark:text-gray-400">[Complex Object]</span>;
    }

    // Handle objects and arrays
    const isArray = Array.isArray(value);
    const keys = Object.keys(value as object);
    const isEmpty = keys.length === 0;
    
    if (isEmpty) {
      return <span>{isArray ? "[]" : "{}"}</span>;
    }

    const expanded = isExpanded(path);
    
    // Try to find a function name (or other meaningful name) for objects
    const getFunctionName = (obj: any): string | null => {
      if (typeof obj !== 'object' || !obj) return null;
      if (obj.name && typeof obj.name === 'string') return obj.name;
      if (obj.functionName && typeof obj.functionName === 'string') return obj.functionName;
      return null;
    };
    
    // Get function name if applicable
    const functionName = !isArray ? getFunctionName(value) : null;
    
    // Compact notation for objects and arrays
    const sizeDisplay = (
      <>
        <span className="font-mono dark:text-gray-200">
          {isArray ? `[${keys.length}]` : `{${keys.length}}`}
        </span>
        {functionName && (
          <span className="ml-1 text-gray-500 dark:text-gray-400 text-sm">
            {functionName}
          </span>
        )}
      </>
    );
    
    // The expand/collapse arrow
    const toggleButton = (
      <span 
        className="mx-1 text-blue-500 dark:text-blue-400 cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          togglePath(path);
        }}
      >
        {expanded ? "▼" : "▶"}
      </span>
    );
    
    // Root level call (no key name provided)
    if (keyName === undefined && depth === 0) {
      return (
        <div>
          <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
            {toggleButton} {sizeDisplay}
          </div>
          
          {expanded && (
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-2">
              {keys.map((key) => {
                const childPath = `${path}.${key}`;
                const childValue = (value as Record<string, unknown>)[key];
                
                return (
                  <div key={childPath} className="py-1">
                    {isArray 
                      ? renderNode(childValue, childPath, depth + 1) 
                      : renderNode(childValue, childPath, depth + 1, key)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    
    // Non-root elements with a key
    if (keyName !== undefined) {
      return (
        <div>
          <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
            {toggleButton}
            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300 mr-1">
              {keyName}:
            </span>
            {sizeDisplay}
          </div>
          
          {expanded && (
            <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-2 mt-1">
              {keys.map((key) => {
                const childPath = `${path}.${key}`;
                const childValue = (value as Record<string, unknown>)[key];
                
                return (
                  <div key={childPath} className="py-1">
                    {isArray 
                      ? renderNode(childValue, childPath, depth + 1) 
                      : renderNode(childValue, childPath, depth + 1, key)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    
    // Array items (no key displayed)
    return (
      <div>
        <div className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
          {toggleButton} {sizeDisplay}
        </div>
        
        {expanded && (
          <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-2 mt-1">
            {keys.map((key) => {
              const childPath = `${path}.${key}`;
              const childValue = (value as Record<string, unknown>)[key];
              
              return (
                <div key={childPath} className="py-1">
                  {isArray 
                    ? renderNode(childValue, childPath, depth + 1) 
                    : renderNode(childValue, childPath, depth + 1, key)}
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
