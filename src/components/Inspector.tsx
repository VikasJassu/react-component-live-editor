import React, { useState, useEffect } from "react";
import type { ElementPath } from "../types";
import "./Inspector.css";

interface InspectorProps {
  selectedElement: ElementPath | null;
  onPropertyChange: (property: string, value: string) => void;
}

interface ElementProperties {
  textContent: string;
  style: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
    border: string;
    width: string;
    height: string;
  };
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedElement,
  onPropertyChange,
}) => {
  const [properties, setProperties] = useState<ElementProperties>({
    textContent: "",
    style: {
      color: "",
      backgroundColor: "",
      fontSize: "",
      fontWeight: "",
      padding: "",
      margin: "",
      borderRadius: "",
      border: "",
      width: "",
      height: "",
    },
  });

  // Helper function to convert RGB to hex
  const rgbToHex = (rgb: string): string => {
    if (!rgb || !rgb.includes("rgb")) return rgb;

    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return rgb;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Extract current properties from the selected element
  useEffect(() => {
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
      const computedStyle = window.getComputedStyle(current);

      setProperties({
        textContent: current.textContent || "",
        style: {
          color: computedStyle.color || "",
          backgroundColor: computedStyle.backgroundColor || "",
          fontSize: computedStyle.fontSize || "",
          fontWeight: computedStyle.fontWeight || "",
          padding: computedStyle.padding || "",
          margin: computedStyle.margin || "",
          borderRadius: computedStyle.borderRadius || "",
          border: computedStyle.border || "",
          width: computedStyle.width || "",
          height: computedStyle.height || "",
        },
      });
    }
  }, [selectedElement]);

  const handleStyleChange = (property: string, value: string) => {
    setProperties((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        [property]: value,
      },
    }));
    onPropertyChange(`style.${property}`, value);
  };

  const handleTextChange = (value: string) => {
    setProperties((prev) => ({
      ...prev,
      textContent: value,
    }));
    onPropertyChange("textContent", value);
  };

  if (!selectedElement) {
    return (
      <div className="inspector-panel">
        <h3>Inspector Panel</h3>
        <div className="inspector-empty">
          <p>👆 Click on any element in the preview to inspect it</p>
          <div className="inspector-tips">
            <h4>Tips:</h4>
            <ul>
              <li>Hover over elements to see them highlighted</li>
              <li>Click to select and inspect properties</li>
              <li>Selected elements are outlined in red</li>
              <li>Edit properties in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-panel">
      <h3>Inspector Panel</h3>

      <div className="element-inspector">
        <div className="element-info">
          <h4>Selected Element</h4>
          <p>
            <strong>Type:</strong> {selectedElement.elementType}
          </p>
          <p>
            <strong>Path:</strong> [{selectedElement.indices.join(", ")}]
          </p>
          <p>
            <strong>XPath:</strong> {selectedElement.xpath}
          </p>
          <p>
            <strong>Selector:</strong> {selectedElement.selector}
          </p>
          {selectedElement.key && (
            <p>
              <strong>Key:</strong> {selectedElement.key}
            </p>
          )}
          <button
            className="copy-xpath-btn"
            onClick={() => {
              navigator.clipboard.writeText(selectedElement.xpath);
              console.log("XPath copied to clipboard:", selectedElement.xpath);
            }}
          >
            Copy XPath
          </button>
        </div>

        <div className="property-section">
          <h4>Content</h4>
          <div className="property-group">
            <label>Text Content:</label>
            <textarea
              value={properties.textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Element text content"
              rows={2}
            />
          </div>
        </div>

        <div className="property-section">
          <h4>Typography</h4>
          <div className="property-group">
            <label>Color:</label>
            <input
              type="color"
              value={rgbToHex(properties.style.color) || "#000000"}
              onChange={(e) => handleStyleChange("color", e.target.value)}
            />
            <input
              type="text"
              value={properties.style.color}
              onChange={(e) => handleStyleChange("color", e.target.value)}
              placeholder="e.g., #ff0000, red"
            />
          </div>

          <div className="property-group">
            <label>Font Size:</label>
            <input
              type="text"
              value={properties.style.fontSize}
              onChange={(e) => handleStyleChange("fontSize", e.target.value)}
              placeholder="e.g., 16px, 1.2em"
            />
          </div>

          <div className="property-group">
            <label>Font Weight:</label>
            <select
              value={properties.style.fontWeight}
              onChange={(e) => handleStyleChange("fontWeight", e.target.value)}
            >
              <option value="">Default</option>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="lighter">Lighter</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>
        </div>

        <div className="property-section">
          <h4>Background & Border</h4>
          <div className="property-group">
            <label>Background Color:</label>
            <input
              type="color"
              value={rgbToHex(properties.style.backgroundColor) || "#ffffff"}
              onChange={(e) =>
                handleStyleChange("backgroundColor", e.target.value)
              }
            />
            <input
              type="text"
              value={properties.style.backgroundColor}
              onChange={(e) =>
                handleStyleChange("backgroundColor", e.target.value)
              }
              placeholder="e.g., #ffffff, transparent"
            />
          </div>

          <div className="property-group">
            <label>Border:</label>
            <input
              type="text"
              value={properties.style.border}
              onChange={(e) => handleStyleChange("border", e.target.value)}
              placeholder="e.g., 1px solid #ccc"
            />
          </div>

          <div className="property-group">
            <label>Border Radius:</label>
            <input
              type="text"
              value={properties.style.borderRadius}
              onChange={(e) =>
                handleStyleChange("borderRadius", e.target.value)
              }
              placeholder="e.g., 4px, 50%"
            />
          </div>
        </div>

        <div className="property-section">
          <h4>Spacing</h4>
          <div className="property-group">
            <label>Padding:</label>
            <input
              type="text"
              value={properties.style.padding}
              onChange={(e) => handleStyleChange("padding", e.target.value)}
              placeholder="e.g., 10px, 5px 10px"
            />
          </div>

          <div className="property-group">
            <label>Margin:</label>
            <input
              type="text"
              value={properties.style.margin}
              onChange={(e) => handleStyleChange("margin", e.target.value)}
              placeholder="e.g., 10px, 5px 10px"
            />
          </div>
        </div>

        <div className="property-section">
          <h4>Dimensions</h4>
          <div className="property-group">
            <label>Width:</label>
            <input
              type="text"
              value={properties.style.width}
              onChange={(e) => handleStyleChange("width", e.target.value)}
              placeholder="e.g., 100px, 50%, auto"
            />
          </div>

          <div className="property-group">
            <label>Height:</label>
            <input
              type="text"
              value={properties.style.height}
              onChange={(e) => handleStyleChange("height", e.target.value)}
              placeholder="e.g., 100px, 50%, auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
