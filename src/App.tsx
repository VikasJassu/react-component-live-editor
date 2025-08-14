import React, { useState, useCallback } from "react";
import { CodeInput } from "./components/CodeInput";
import { PreviewPane } from "./components/PreviewPane";
import { Inspector } from "./components/Inspector";
import { JSXCompiler } from "./services/JSXCompiler";
import { apiService } from "./services/ApiService";
import "./App.css";
import type { CompilationError, ElementPath, ElementProperties } from "./types";

function App() {
  const [jsxCode, setJsxCode] = useState<string>(`function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
      <h1 style={{color: 'blue'}}>React Counter</h1>
      <p style={{fontSize: '18px'}}>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Increment
      </button>
      <button 
        onClick={() => setCount(0)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: '10px'
        }}
      >
        Reset
      </button>
    </div>
  );
}`);
  const [compiledComponent, setCompiledComponent] =
    useState<React.ComponentType | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementPath | null>(
    null
  );
  const [compilationError, setCompilationError] =
    useState<CompilationError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedComponentId, setSavedComponentId] = useState<string | null>(null);
  const [elementProperties, setElementProperties] = useState<
    Map<string, ElementProperties>
  >(new Map());

  const compiler = JSXCompiler.getInstance();

  const handleCodeChange = useCallback((code: string) => {
    setJsxCode(code);
    // Clear previous compilation results when code changes
    setCompilationError(null);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!jsxCode.trim()) {
      return;
    }

    setIsLoading(true);
    setCompilationError(null);

    try {
      const component = await compiler.compileJSX(jsxCode);
      setCompiledComponent(() => component);
    } catch (error: any) {
      setCompilationError({
        message: error.message,
        type: "babel",
      });
      setCompiledComponent(null);
    } finally {
      setIsLoading(false);
    }
  }, [jsxCode, compiler]);

  const handleElementSelect = useCallback((path: ElementPath) => {
    setSelectedElement(path);
  }, []);

  const handlePropertyChange = useCallback(
    (property: string, value: string) => {
      if (!selectedElement) return;

      // Find the actual DOM element
      const container = document.querySelector(".component-container");
      if (!container) return;

      let current: Element = container;
      for (const index of selectedElement.indices) {
        const children = Array.from(current.children);
        if (children[index]) {
          current = children[index];
        } else {
          return;
        }
      }

      if (current instanceof HTMLElement && current !== container) {
        if (property === "textContent") {
          // Update text content
          current.textContent = value;
        } else if (property.startsWith("style.")) {
          // Update style property
          const styleProp = property.replace("style.", "");
          (current.style as any)[styleProp] = value;
        }

        // Update element properties state for persistence using XPath
        const pathKey = selectedElement.xpath;
        const currentProps = elementProperties.get(pathKey) || { style: {} };

        if (property === "textContent") {
          currentProps.textContent = value;
        } else if (property.startsWith("style.")) {
          const styleProp = property.replace("style.", "");
          currentProps.style = { ...currentProps.style, [styleProp]: value };
        }

        const newProperties = new Map(elementProperties);
        newProperties.set(pathKey, currentProps);
        setElementProperties(newProperties);
      }
    },
    [selectedElement, elementProperties]
  );

  const handleSaveComponent = useCallback(async () => {
    if (!jsxCode.trim()) return;

    setIsSaving(true);
    try {
      const propertiesObject: Record<string, ElementProperties> = {};
      elementProperties.forEach((props, path) => {
        propertiesObject[path] = props;
      });

      const response = await apiService.saveComponent({
        code: jsxCode,
        properties: propertiesObject,
        title: "React Component",
        description: "Created with React Live Inspector",
      });

      setSavedComponentId(response.id);

      // Update the JSX code with the backend-processed version
      if (response.code && response.code !== jsxCode) {
        setJsxCode(response.code);
        // Trigger recompilation with updated code
        await handlePreview();
      }

      // Show success message (you could add a toast notification here)
      console.log("Component saved successfully:", response);
    } catch (error) {
      console.error("Failed to save component:", error);
      // Show error message (you could add a toast notification here)
    } finally {
      setIsSaving(false);
    }
  }, [jsxCode, elementProperties, handlePreview]);

  const handleLoadComponent = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const component = await apiService.loadComponent(id);

        setJsxCode(component.code);
        setSavedComponentId(component.id);

        // Convert properties object back to Map
        const propertiesMap = new Map<string, ElementProperties>();
        Object.entries(component.properties).forEach(([path, props]) => {
          propertiesMap.set(path, props);
        });
        setElementProperties(propertiesMap);

        // Trigger recompilation
        await handlePreview();
      } catch (error) {
        console.error("Failed to load component:", error);
        setCompilationError({
          message: `Failed to load component: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          type: "runtime",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [handlePreview]
  );

  // Auto-compile on initial load and handle URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loadId = urlParams.get("load");

    if (loadId) {
      handleLoadComponent(loadId);
    } else {
      handlePreview();
    }
  }, [handleLoadComponent, handlePreview]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>React Live Inspector</h1>
            <p>
              Paste JSX or React components, see them render, click to inspect
              and edit properties
            </p>
          </div>
          <div className="header-actions">
            <button
              className="save-button"
              onClick={handleSaveComponent}
              disabled={isSaving || !jsxCode.trim()}
            >
              {isSaving ? "Saving..." : "Save Component"}
            </button>
            {savedComponentId && (
              <div className="saved-info">
                <span>✅ Saved</span>
                <button
                  className="share-button"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}?load=${savedComponentId}`;
                    navigator.clipboard.writeText(shareUrl);
                    console.log("Share URL copied to clipboard:", shareUrl);
                  }}
                >
                  Copy Share Link
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-panels">
          <div className="left-panel">
            <CodeInput
              value={jsxCode}
              onChange={handleCodeChange}
              onPreview={handlePreview}
              isLoading={isLoading}
              error={compilationError?.message}
            />
          </div>

          <div className="center-panel">
            <PreviewPane
              component={compiledComponent}
              onElementSelect={handleElementSelect}
              selectedPath={selectedElement}
              isLoading={isLoading}
              error={compilationError}
            />
          </div>

          <div className="right-panel">
            <Inspector
              selectedElement={selectedElement}
              onPropertyChange={handlePropertyChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
