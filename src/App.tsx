import React, { useState, useCallback } from "react";
import { CodeInput } from "./components/CodeInput";
import { PreviewPane } from "./components/PreviewPane";
import { Inspector } from "./components/Inspector";
import { JSXCompiler } from "./services/JSXCompiler";
import { apiService } from "./services/ApiService";
import "./App.css";
import type { CompilationError, ElementPath, ElementProperties } from "./types";

const initialComponent = `const BlogPost = () => {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "24px",
        borderRadius: 12,
        border: "1px solid #ececec",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        background: "#fff",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.25 }}>
          Designing Simple Interfaces
        </h1>

        <p style={{ margin: "6px 0 0", color: "#555" }}>
          Why clarity beats complexity in everyday products
        </p>

        <p style={{ marginTop: 10, color: "#777", fontSize: 14 }}>
          <span>By Priya Sharma</span>
          <span> • Aug 19, 2025</span>
        </p>
      </div>

      <div style={{ color: "#222", fontSize: 18 }}>
        <p style={{ marginTop: 0 }}>
          Simplicity in design isn’t about removing features—it’s about revealing
          intent. Start by identifying the primary task, reduce visual noise, and
          use spacing and typography to guide attention. Thoughtful defaults,
          clear labels, and consistent patterns help users feel confident and
          move faster. In this short post, we’ll explore practical ways to trim
          friction, communicate hierarchy, and ship interfaces that feel calm,
          useful, and enjoyable.
        </p>
      </div>
    </div>
  );
};
`;

function App() {
  const [jsxCode, setJsxCode] = useState<string>(initialComponent);
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

    const isUpdate = !!savedComponentId;
    setIsSaving(true);

    try {
      const propertiesObject: Record<string, ElementProperties> = {};
      elementProperties.forEach((props, path) => {
        propertiesObject[path] = props;
      });

      let response;

      if (isUpdate) {
        // Update existing component
        response = await apiService.updateComponent(savedComponentId, {
          code: jsxCode,
          properties: propertiesObject,
          title: "React Component",
          description: "Updated with React Live Inspector",
        });
      } else {
        // Create new component
        response = await apiService.saveComponent({
          code: jsxCode,
          properties: propertiesObject,
          title: "React Component",
          description: "Created with React Live Inspector",
        });
        setSavedComponentId(response.id);
      }

      // Update the JSX code with the backend-processed version
      if (response.code && response.code !== jsxCode) {
        setJsxCode(response.code);
        // Trigger recompilation with updated code
        await handlePreview();
      }

      const newUrl = `?load=${response.id}`; // <-- Adjust path
      window.history.replaceState(null, "", newUrl);

      // Show success message
      console.log(
        `Component ${isUpdate ? "updated" : "saved"} successfully:`,
        response
      );
    } catch (error) {
      console.error(
        `Failed to ${isUpdate ? "update" : "save"} component:`,
        error
      );
    } finally {
      setIsSaving(false);
    }
  }, [jsxCode, elementProperties, handlePreview, savedComponentId]);

  const handleNewComponent = useCallback(() => {
    window.history.replaceState(null, "", "/");
    setSavedComponentId(null);
    setElementProperties(new Map());
    setSelectedElement(null);
    setJsxCode(initialComponent);
    handlePreview();
  }, [handlePreview]);

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
              {savedComponentId && (
                <span className="editing-indicator">
                  {" "}
                  • Editing saved component
                </span>
              )}
            </p>
          </div>
          <div className="header-actions">
            {savedComponentId && (
              <button
                className="new-button"
                onClick={handleNewComponent}
                disabled={isSaving}
              >
                New Component
              </button>
            )}
            <button
              className="save-button"
              onClick={handleSaveComponent}
              disabled={isSaving || !jsxCode.trim()}
            >
              {isSaving
                ? savedComponentId
                  ? "Updating..."
                  : "Saving..."
                : savedComponentId
                ? "Update Component"
                : "Save Component"}
            </button>
            {savedComponentId && (
              <div className="saved-info">
                <span>✅ Saved</span>
                {/* <button
                  className="share-button"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}?load=${savedComponentId}`;
                    navigator.clipboard.writeText(shareUrl);
                    console.log("Share URL copied to clipboard:", shareUrl);
                  }}
                >
                  Copy Share Link
                </button> */}
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
