import React, { useCallback, useRef } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import "./PreviewPane.css";
import type { CompilationError, ElementPath } from "../types";

interface PreviewPaneProps {
  component: React.ComponentType | null;
  onElementSelect?: (path: ElementPath) => void;
  selectedPath?: ElementPath | null;
  isLoading?: boolean;
  error?: CompilationError | null;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  component: Component,
  onElementSelect,
  selectedPath,
  isLoading = false,
  error,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleError = (error: CompilationError) => {
    console.error("Preview pane error:", error);
  };

  const handleElementClick = useCallback(
    (event: React.MouseEvent) => {
      if (!onElementSelect) return;

      event.preventDefault();
      event.stopPropagation();

      const target = event.target as HTMLElement;
      const container = containerRef.current;

      if (!container || !target) return;

      // Find the path to the clicked element
      const path = getElementPath(target, container);
      if (path) {
        onElementSelect(path);
      }
    },
    [onElementSelect]
  );

  const getElementPath = (
    element: HTMLElement,
    container: HTMLElement
  ): ElementPath | null => {
    const path: number[] = [];
    let current = element;

    // Traverse up to find the path indices
    while (current && current !== container && current.parentElement) {
      const parent = current.parentElement;
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current);
      path.unshift(index);
      current = parent;
    }

    if (current !== container) {
      return null;
    }

    // Generate XPath
    const xpath = generateXPath(element, container);

    // Generate CSS selector
    const selector = generateCSSSelector(element, container);

    return {
      indices: path,
      elementType: element.tagName.toLowerCase(),
      key: element.getAttribute("data-key") || undefined,
      xpath,
      selector,
    };
  };

  const generateXPath = (
    element: HTMLElement,
    container: HTMLElement
  ): string => {
    const parts: string[] = [];
    let current = element;

    while (current && current !== container && current.parentElement) {
      const parent = current.parentElement;
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current.tagName
      );

      if (siblings.length === 1) {
        parts.unshift(current.tagName.toLowerCase());
      } else {
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      }

      current = parent;
    }

    return `//${parts.join("/")}`;
  };

  const generateCSSSelector = (
    element: HTMLElement,
    container: HTMLElement
  ): string => {
    const parts: string[] = [];
    let current = element;

    while (current && current !== container && current.parentElement) {
      const parent = current.parentElement;
      const tagName = current.tagName.toLowerCase();

      // Check for ID
      if (current.id) {
        parts.unshift(`#${current.id}`);
        break;
      }

      // Check for unique class
      if (current.className) {
        const classes = current.className.split(" ").filter((c) => c.trim());
        if (classes.length > 0) {
          parts.unshift(`${tagName}.${classes.join(".")}`);
        } else {
          parts.unshift(tagName);
        }
      } else {
        // Use nth-child if no class
        const siblings = Array.from(parent.children).filter(
          (child) => child.tagName === current.tagName
        );

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          parts.unshift(`${tagName}:nth-child(${index})`);
        } else {
          parts.unshift(tagName);
        }
      }

      current = parent;
    }

    return parts.join(" > ");
  };

  // Update selected element highlighting
  React.useEffect(() => {
    if (!containerRef.current || !selectedPath) return;

    // Remove previous selection
    const previousSelected =
      containerRef.current.querySelector(".selected-element");
    if (previousSelected) {
      previousSelected.classList.remove("selected-element");
    }

    // Find and highlight the selected element
    let current: Element = containerRef.current;
    for (const index of selectedPath.indices) {
      const children = Array.from(current.children);
      if (children[index]) {
        current = children[index];
      } else {
        return; // Path is invalid
      }
    }

    if (
      current &&
      current !== containerRef.current &&
      current instanceof HTMLElement
    ) {
      current.classList.add("selected-element");
    }
  }, [selectedPath]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="preview-loading">
          <div className="loading-spinner"></div>
          <p>Compiling component...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="preview-error">
          <h4>Compilation Error</h4>
          <p>{error.message}</p>
          {error.line && (
            <p className="error-location">
              Line {error.line}
              {error.column && `, Column ${error.column}`}
            </p>
          )}
        </div>
      );
    }

    if (!Component) {
      return (
        <div className="preview-empty">
          <p>Enter JSX code and click "Preview" to see your component</p>
        </div>
      );
    }

    return (
      <ErrorBoundary onError={handleError}>
        <div
          ref={containerRef}
          className="component-container"
          onClick={handleElementClick}
        >
          <Component />
        </div>
      </ErrorBoundary>
    );
  };

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <h3>Preview</h3>
      </div>
      <div className="preview-content">{renderContent()}</div>
    </div>
  );
};
