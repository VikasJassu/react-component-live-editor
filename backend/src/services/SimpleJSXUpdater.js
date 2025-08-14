class SimpleJSXUpdater {
  constructor() {
    // Simple regex patterns for JSX manipulation
    this.patterns = {
      // Match JSX elements: <tagName ...>
      jsxElement: /<(\w+)([^>]*?)>/g,
      // Match style attribute: style={{...}}
      styleAttribute: /style=\{\{([^}]*)\}\}/g,
      // Match individual style properties: property: 'value'
      styleProperty: /(\w+):\s*['"]([^'"]*)['"]/g,
      // Match text content between tags
      textContent: />([^<]*)</g,
    };
  }

  /**
   * Update JSX code with new properties based on XPath
   */
  async updateJSXCode(code, updates) {
    try {
      console.log("Updating JSX code with XPath:", updates);

      let updatedCode = code;

      // For each XPath update
      for (const [xpath, properties] of Object.entries(updates)) {
        updatedCode = this.applyUpdatesToCode(updatedCode, xpath, properties);
      }

      return updatedCode;
    } catch (error) {
      console.error("Error updating JSX code:", error);
      throw new Error(`Failed to update JSX code: ${error.message}`);
    }
  }

  /**
   * Apply property updates to JSX code
   */
  applyUpdatesToCode(code, xpath, properties) {
    // Convert XPath to element targeting
    const elementInfo = this.parseXPath(xpath);

    if (!elementInfo) {
      console.warn(`Could not parse XPath: ${xpath}`);
      return code;
    }

    let updatedCode = code;

    // Update style properties first
    if (properties.style) {
      const targetElement = this.findElementByPath(updatedCode, elementInfo);
      if (targetElement) {
        updatedCode = this.updateStyleProperties(
          updatedCode,
          targetElement,
          properties.style
        );
      }
    }

    // Update text content second (re-find element after style changes)
    if (properties.textContent !== undefined) {
      const targetElement = this.findElementByPath(updatedCode, elementInfo);
      if (targetElement) {
        updatedCode = this.updateTextContent(
          updatedCode,
          targetElement,
          properties.textContent
        );
      }
    }

    return updatedCode;
  }

  /**
   * Parse XPath into element information
   */
  parseXPath(xpath) {
    // Simple XPath parsing: //div/h1[2] -> {tag: 'h1', path: ['div', 'h1'], index: 1}
    const cleanPath = xpath.replace(/^\/\//, "");
    const parts = cleanPath.split("/");

    if (parts.length === 0) return null;

    const lastPart = parts[parts.length - 1];
    const match = lastPart.match(/^(\w+)(?:\[(\d+)\])?$/);

    if (!match) return null;

    return {
      tag: match[1],
      index: match[2] ? parseInt(match[2]) - 1 : 0,
      path: parts.map((part) => part.replace(/\[\d+\]/, "")),
    };
  }

  /**
   * Find element in code by path (simplified approach)
   */
  findElementByPath(code, elementInfo) {
    const { tag, index } = elementInfo;

    // Find all occurrences of the target tag
    const tagPattern = new RegExp(`<${tag}([^>]*?)>`, "g");
    const matches = [];
    let match;

    while ((match = tagPattern.exec(code)) !== null) {
      matches.push({
        fullMatch: match[0],
        attributes: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        tag: tag,
      });
    }

    // Return the element at the specified index
    return matches[index] || matches[0] || null;
  }

  /**
   * Update style properties in JSX element
   */
  updateStyleProperties(code, targetElement, styleUpdates) {
    const { fullMatch, attributes, startIndex, endIndex } = targetElement;

    // Check if element already has style attribute
    const existingStyleMatch = attributes.match(/style=\{\{([^}]*)\}\}/);

    let newAttributes = attributes;

    if (existingStyleMatch) {
      // Update existing style
      const existingStyles = this.parseStyleString(existingStyleMatch[1]);
      const mergedStyles = { ...existingStyles, ...styleUpdates };
      const newStyleString = this.generateStyleString(mergedStyles);

      newAttributes = attributes.replace(
        /style=\{\{[^}]*\}\}/,
        `style={{${newStyleString}}}`
      );
    } else {
      // Add new style attribute - ensure proper spacing
      const newStyleString = this.generateStyleString(styleUpdates);
      const trimmedAttributes = attributes.trim();
      newAttributes = trimmedAttributes
        ? ` style={{${newStyleString}}} ${trimmedAttributes}`
        : ` style={{${newStyleString}}}`;
    }

    // Replace the element in the code
    const newElement = `<${targetElement.tag}${newAttributes}>`;
    return (
      code.substring(0, startIndex) + newElement + code.substring(endIndex)
    );
  }

  /**
   * Parse style string into object
   */
  parseStyleString(styleString) {
    const styles = {};
    const propertyPattern = /(\w+):\s*['"]([^'"]*)['"]/g;
    let match;

    while ((match = propertyPattern.exec(styleString)) !== null) {
      styles[match[1]] = match[2];
    }

    return styles;
  }

  /**
   * Generate style string from object
   */
  generateStyleString(styles) {
    return Object.entries(styles)
      .map(([key, value]) => `${key}: '${value}'`)
      .join(", ");
  }

  /**
   * Update text content of JSX element
   */
  updateTextContent(code, targetElement, newTextContent) {
    const { tag, endIndex } = targetElement;

    // Find the closing tag
    const closingTagPattern = new RegExp(`</${tag}>`, "g");
    closingTagPattern.lastIndex = endIndex;
    const closingMatch = closingTagPattern.exec(code);

    if (!closingMatch) {
      console.warn(`Could not find closing tag for ${tag}`);
      return code;
    }

    // Replace content between opening and closing tags
    const contentStart = endIndex;
    const contentEnd = closingMatch.index;

    return (
      code.substring(0, contentStart) +
      newTextContent +
      code.substring(contentEnd)
    );
  }

  /**
   * Simple JSX validation
   */
  validateJSX(code) {
    try {
      // Basic validation checks
      const openTags = (code.match(/</g) || []).length;
      const closeTags = (code.match(/>/g) || []).length;

      if (openTags !== closeTags) {
        return {
          valid: false,
          error: "Mismatched JSX tags",
        };
      }

      // Check for basic JSX structure
      if (!code.includes("<") || !code.includes(">")) {
        return {
          valid: false,
          error: "No JSX elements found",
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract component structure for debugging
   */
  analyzeJSXStructure(code) {
    const structure = [];
    const elementPattern = /<(\w+)([^>]*?)>/g;
    let match;

    while ((match = elementPattern.exec(code)) !== null) {
      structure.push({
        tag: match[1],
        attributes: match[2]
          .trim()
          .split(/\s+/)
          .filter((attr) => attr.length > 0),
        position: match.index,
      });
    }

    return structure;
  }
}

module.exports = SimpleJSXUpdater;
