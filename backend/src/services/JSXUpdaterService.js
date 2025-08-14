const babel = require("@babel/core");
const t = require("@babel/types");
const generate = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;

class JSXUpdaterService {
  constructor() {
    this.babelOptions = {
      presets: [
        [
          "@babel/preset-react",
          {
            pragma: "React.createElement",
            pragmaFrag: "React.Fragment",
          },
        ],
      ],
      plugins: ["@babel/plugin-syntax-jsx"],
      parserOpts: {
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ["jsx"],
      },
    };
  }

  /**
   * Update JSX code with new properties based on XPath
   */
  async updateJSXCode(code, updates) {
    console.log("Updating JSX code with XPath:", updates);
    try {
      // Parse the JSX code into AST with simpler options
      const ast = babel.parse(code, {
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ["jsx"],
      });

      // Apply updates to the AST
      for (const [xpath, properties] of Object.entries(updates)) {
        this.updateElementByXPath(ast, xpath, properties);
      }

      // Generate updated code from AST
      const result = generate(ast, {
        retainLines: false,
        compact: false,
        concise: false,
        quotes: "single",
        jsescOption: {
          quotes: "single",
        },
      });

      return result.code;
    } catch (error) {
      console.error("Error updating JSX code:", error);
      throw new Error(`Failed to update JSX code: ${error.message}`);
    }
  }

  /**
   * Update element properties in AST based on XPath
   */
  updateElementByXPath(ast, xpath, properties) {
    // Convert XPath to element path array
    const elementPath = this.parseXPath(xpath);

    // Find and update the element
    let currentPath = [];

    traverse(ast, {
      JSXElement: (path) => {
        const elementName = this.getElementName(path.node);
        currentPath.push(elementName);

        if (this.matchesPath(currentPath, elementPath)) {
          this.updateElementProperties(path.node, properties);
        }
      },
      exit: (path) => {
        if (path.isJSXElement()) {
          currentPath.pop();
        }
      },
    });
  }

  /**
   * Parse XPath into element path array
   */
  parseXPath(xpath) {
    // Remove leading // and split by /
    const cleanPath = xpath.replace(/^\/\//, "");
    return cleanPath.split("/").map((segment) => {
      // Handle indexed elements like div[2]
      const match = segment.match(/^(\w+)(?:\[(\d+)\])?$/);
      if (match) {
        return {
          tag: match[1],
          index: match[2] ? parseInt(match[2]) - 1 : 0,
        };
      }
      return { tag: segment, index: 0 };
    });
  }

  /**
   * Get element name from JSX element
   */
  getElementName(jsxElement) {
    if (t.isJSXIdentifier(jsxElement.openingElement.name)) {
      return jsxElement.openingElement.name.name.toLowerCase();
    }
    return "unknown";
  }

  /**
   * Check if current path matches target path
   */
  matchesPath(currentPath, targetPath) {
    if (currentPath.length !== targetPath.length) {
      return false;
    }

    // For now, do simple tag matching
    // In a more sophisticated implementation, we'd track indices
    return currentPath.every((tag, index) => tag === targetPath[index].tag);
  }

  /**
   * Update element properties (style and text content)
   */
  updateElementProperties(jsxElement, properties) {
    const openingElement = jsxElement.openingElement;

    // Update style properties
    if (properties.style) {
      this.updateStyleAttribute(openingElement, properties.style);
    }

    // Update text content
    if (properties.textContent !== undefined) {
      this.updateTextContent(jsxElement, properties.textContent);
    }
  }

  /**
   * Update or create style attribute
   */
  updateStyleAttribute(openingElement, styleUpdates) {
    let styleAttr = openingElement.attributes.find(
      (attr) =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name) &&
        attr.name.name === "style"
    );

    if (!styleAttr) {
      // Create new style attribute
      styleAttr = t.jsxAttribute(
        t.jsxIdentifier("style"),
        t.jsxExpressionContainer(t.objectExpression([]))
      );
      openingElement.attributes.push(styleAttr);
    }

    // Get or create style object
    let styleObject;
    if (
      t.isJSXExpressionContainer(styleAttr.value) &&
      t.isObjectExpression(styleAttr.value.expression)
    ) {
      styleObject = styleAttr.value.expression;
    } else {
      styleObject = t.objectExpression([]);
      styleAttr.value = t.jsxExpressionContainer(styleObject);
    }

    // Update style properties
    for (const [styleProp, styleValue] of Object.entries(styleUpdates)) {
      const camelCaseProp = this.toCamelCase(styleProp);

      // Find existing property
      const existingProp = styleObject.properties.find(
        (prop) =>
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key) &&
          prop.key.name === camelCaseProp
      );

      const newProperty = t.objectProperty(
        t.identifier(camelCaseProp),
        t.stringLiteral(styleValue)
      );

      if (existingProp) {
        // Update existing property
        const index = styleObject.properties.indexOf(existingProp);
        styleObject.properties[index] = newProperty;
      } else {
        // Add new property
        styleObject.properties.push(newProperty);
      }
    }
  }

  /**
   * Update text content of JSX element
   */
  updateTextContent(jsxElement, textContent) {
    // Clear existing children and set new text
    jsxElement.children = [t.jsxText(textContent)];
  }

  /**
   * Convert CSS property to camelCase
   */
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Simple JSX validation
   */
  validateJSX(code) {
    try {
      babel.parse(code, {
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ["jsx"],
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        line: error.loc?.line,
        column: error.loc?.column,
      };
    }
  }

  /**
   * Extract component structure for debugging
   */
  analyzeJSXStructure(code) {
    try {
      const ast = babel.parse(code, {
        sourceType: "module",
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ["jsx"],
      });
      const structure = [];

      traverse(ast, {
        JSXElement: (path) => {
          const elementName = this.getElementName(path.node);
          const depth = path.getFunctionParent() ? 1 : 0;

          structure.push({
            tag: elementName,
            depth,
            attributes: path.node.openingElement.attributes.map((attr) => {
              if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                return attr.name.name;
              }
              return "unknown";
            }),
          });
        },
      });

      return structure;
    } catch (error) {
      throw new Error(`Failed to analyze JSX structure: ${error.message}`);
    }
  }
}

module.exports = JSXUpdaterService;
