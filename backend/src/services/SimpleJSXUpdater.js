class SimpleJSXUpdater {
  constructor() {
    // Improved regex patterns for JSX manipulation
    this.patterns = {
      // Match JSX elements: <tagName ...> (multi-line support)
      jsxElement: /<(\w+)([\s\S]*?)>/g,
      // Match style attribute: style={{...}} (multi-line support)
      styleAttribute: /style=\{\{([\s\S]*?)\}\}/g,
      // Match individual style properties: property: 'value' (improved)
      styleProperty: /(\w+)\s*:\s*(['"`])([^'"]*?)\2/g,
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
    console.log(`\n=== Applying updates for XPath: ${xpath} ===`);
    console.log("Properties:", properties);

    // Convert XPath to element targeting
    const elementInfo = this.parseXPath(xpath);

    if (!elementInfo) {
      console.warn(`Could not parse XPath: ${xpath}`);
      return code;
    }

    console.log("Parsed element info:", elementInfo);

    let updatedCode = code;

    // Update style properties first
    if (properties.style) {
      console.log("Finding target element for style update...");
      const targetElement = this.findElementByPath(updatedCode, elementInfo);

      if (targetElement) {
        console.log("Target element found:", {
          tag: targetElement.tag,
          startIndex: targetElement.startIndex,
          endIndex: targetElement.endIndex,
          hasAttributes: !!targetElement.attributes,
        });

        const beforeUpdate = updatedCode;
        updatedCode = this.updateStyleProperties(
          updatedCode,
          targetElement,
          properties.style
        );

        console.log(
          "Style update completed. Code changed:",
          beforeUpdate !== updatedCode
        );
        if (beforeUpdate === updatedCode) {
          console.warn("WARNING: Code was not modified by style update!");
        }
      } else {
        console.warn(`No target element found for XPath: ${xpath}`);

        // Fallback to simple targeting for backward compatibility
        console.log("Trying fallback simple targeting...");
        const fallbackResult = this.fallbackSimpleUpdate(
          updatedCode,
          xpath,
          properties.style
        );
        if (fallbackResult !== updatedCode) {
          console.log("Fallback update succeeded");
          updatedCode = fallbackResult;
        }
      }
    }

    // Update text content second (re-find element after style changes)
    if (properties.textContent !== undefined) {
      console.log("Finding target element for text content update...");
      const targetElement = this.findElementByPath(updatedCode, elementInfo);
      if (targetElement) {
        updatedCode = this.updateTextContent(
          updatedCode,
          targetElement,
          properties.textContent
        );
      }
    }

    console.log(`=== Finished updates for XPath: ${xpath} ===\n`);
    return updatedCode;
  }

  /**
   * Parse XPath into element information with full path support
   */
  parseXPath(xpath) {
    // Enhanced XPath parsing: //div/section[2]/p[1] -> full path with indices
    const cleanPath = xpath.replace(/^\/\//, "");
    const parts = cleanPath.split("/");

    if (parts.length === 0) return null;

    const pathElements = parts
      .map((part) => {
        const match = part.match(/^(\w+)(?:\[(\d+)\])?$/);
        if (!match) return null;

        return {
          tag: match[1].toLowerCase(),
          index: match[2] ? parseInt(match[2]) - 1 : 0,
        };
      })
      .filter(Boolean);

    if (pathElements.length === 0) return null;

    return {
      fullPath: pathElements,
      targetTag: pathElements[pathElements.length - 1].tag,
      targetIndex: pathElements[pathElements.length - 1].index,
    };
  }

  /**
   * Find element in code by path (proper JSX parsing)
   */
  findElementByPath(code, elementInfo) {
    if (!elementInfo.fullPath) {
      console.warn("Invalid element info - missing fullPath");
      return null;
    }

    // Build a complete element tree
    const elementTree = this.buildElementTree(code);

    // Find the target element using the full path
    return this.findElementInTree(elementTree, elementInfo.fullPath);
  }

  /**
   * Build a complete tree of all elements in the code
   */
  buildElementTree(code) {
    const elements = [];
    const stack = []; // Track nesting
    let position = 0;

    // Find all opening and closing tags
    const tagPattern = /<\/?(\w+)([^>]*?)>/g;
    let match;

    while ((match = tagPattern.exec(code)) !== null) {
      const isClosing = match[0].startsWith("</");
      const tagName = match[1].toLowerCase();
      const attributes = match[2] || "";
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;

      if (isClosing) {
        // Pop from stack when we find a closing tag
        if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
          const openElement = stack.pop();
          openElement.closingIndex = startIndex;
          openElement.fullEndIndex = endIndex;
        }
      } else {
        // Check if it's a self-closing tag
        const isSelfClosing = match[0].endsWith("/>");

        // Parse the complete opening tag for non-self-closing tags
        let fullMatch = match[0];
        let fullAttributes = attributes;
        let actualEndIndex = endIndex;

        if (!isSelfClosing) {
          // Use the robust parsing for complex attributes
          const robustMatch = this.parseComplexTag(code, startIndex, tagName);
          if (robustMatch) {
            fullMatch = robustMatch.fullMatch;
            fullAttributes = robustMatch.attributes;
            actualEndIndex = robustMatch.endIndex;
          }
        }

        const element = {
          tag: tagName,
          attributes: fullAttributes,
          startIndex: startIndex,
          endIndex: actualEndIndex,
          fullMatch: fullMatch,
          path: [...stack.map((s) => s.tag), tagName],
          depth: stack.length,
          indexInParent: 0, // Will be calculated
          isSelfClosing: isSelfClosing,
        };

        // Calculate index among siblings
        const siblingsAtSameLevel = elements.filter(
          (el) =>
            el.depth === element.depth &&
            el.tag === element.tag &&
            this.arraysEqual(el.path.slice(0, -1), element.path.slice(0, -1))
        );
        element.indexInParent = siblingsAtSameLevel.length;

        elements.push(element);

        // Add to stack if not self-closing
        if (!isSelfClosing) {
          stack.push(element);
        }
      }
    }

    return elements;
  }

  /**
   * Parse complex tag with proper brace/quote handling
   */
  parseComplexTag(code, startIndex, tagName) {
    let i = startIndex + tagName.length + 1; // Start after '<tagName'
    let braceCount = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplate = false;

    // Find the end of the opening tag
    while (i < code.length) {
      const char = code[i];
      const prevChar = i > 0 ? code[i - 1] : "";

      // Handle string literals
      if (char === "'" && !inDoubleQuote && !inTemplate && prevChar !== "\\") {
        inSingleQuote = !inSingleQuote;
      } else if (
        char === '"' &&
        !inSingleQuote &&
        !inTemplate &&
        prevChar !== "\\"
      ) {
        inDoubleQuote = !inDoubleQuote;
      } else if (
        char === "`" &&
        !inSingleQuote &&
        !inDoubleQuote &&
        prevChar !== "\\"
      ) {
        inTemplate = !inTemplate;
      }

      // Handle braces (only count when not in strings)
      if (!inSingleQuote && !inDoubleQuote && !inTemplate) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
        }
      }

      // Check for end of tag
      if (
        char === ">" &&
        braceCount === 0 &&
        !inSingleQuote &&
        !inDoubleQuote &&
        !inTemplate
      ) {
        // Found the end of the opening tag
        const endIndex = i + 1;
        const fullMatch = code.substring(startIndex, endIndex);

        // Extract attributes (everything between tag name and closing >)
        const attributesMatch = fullMatch.match(
          new RegExp(`<${tagName}([\\s\\S]*?)>`, "i")
        );
        const attributes = attributesMatch ? attributesMatch[1] : "";

        return {
          fullMatch: fullMatch,
          attributes: attributes,
          endIndex: endIndex,
        };
      }

      i++;
    }

    return null;
  }

  /**
   * Find element in tree using full path
   */
  findElementInTree(elements, targetPath) {
    // Find elements that match the full path
    const candidates = elements.filter((element) => {
      if (element.path.length !== targetPath.length) {
        return false;
      }

      // Check if path matches
      for (let i = 0; i < targetPath.length; i++) {
        if (element.path[i] !== targetPath[i].tag) {
          return false;
        }
      }

      return true;
    });

    if (candidates.length === 0) {
      console.warn(
        "No elements found matching path:",
        targetPath.map((p) => p.tag).join("/")
      );
      return null;
    }

    // Filter by indices if specified
    let filteredCandidates = candidates;

    for (let pathIndex = 0; pathIndex < targetPath.length; pathIndex++) {
      const targetIndexAtLevel = targetPath[pathIndex].index;

      if (targetIndexAtLevel > 0) {
        // Group candidates by their path up to this level
        const groupedByPath = {};

        filteredCandidates.forEach((candidate) => {
          const pathKey = candidate.path.slice(0, pathIndex + 1).join("/");
          if (!groupedByPath[pathKey]) {
            groupedByPath[pathKey] = [];
          }
          groupedByPath[pathKey].push(candidate);
        });

        // Filter each group by index
        const newCandidates = [];
        Object.values(groupedByPath).forEach((group) => {
          const elementsAtLevel = group.filter(
            (el) => el.path.length > pathIndex
          );
          const targetElement = elementsAtLevel[targetIndexAtLevel];
          if (targetElement) {
            newCandidates.push(targetElement);
          }
        });

        filteredCandidates = newCandidates;
      }
    }

    if (filteredCandidates.length === 0) {
      console.warn(
        "No elements found at specified indices for path:",
        targetPath.map((p) => `${p.tag}[${p.index}]`).join("/")
      );
      return null;
    }

    // Return the first match (or could return all matches if needed)
    const result = filteredCandidates[0];
    console.log(
      `Found element: ${result.tag} at path ${result.path.join("/")} (index ${
        result.indexInParent
      })`
    );

    return result;
  }

  /**
   * Helper function to compare arrays
   */
  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Fallback simple update for backward compatibility
   */
  fallbackSimpleUpdate(code, xpath, styleUpdates) {
    try {
      // Extract just the tag name from xpath for simple matching
      const tagMatch = xpath.match(/\/\/(\w+)(?:\/.*)?$/);
      if (!tagMatch) return code;

      const tag = tagMatch[1];
      console.log(`Fallback: Looking for tag "${tag}"`);

      // Simple regex to find the first occurrence of the tag
      const tagPattern = new RegExp(`<${tag}([\\s\\S]*?)>`, "i");
      const match = tagPattern.exec(code);

      if (!match) {
        console.log(`Fallback: No match found for tag "${tag}"`);
        return code;
      }

      const fullMatch = match[0];
      const attributes = match[1];
      const startIndex = match.index;
      const endIndex = match.index + fullMatch.length;

      console.log(`Fallback: Found element at ${startIndex}-${endIndex}`);

      // Create a simple target element
      const targetElement = {
        tag: tag,
        attributes: attributes,
        startIndex: startIndex,
        endIndex: endIndex,
        fullMatch: fullMatch,
      };

      return this.updateStyleProperties(code, targetElement, styleUpdates);
    } catch (error) {
      console.error("Fallback update failed:", error);
      return code;
    }
  }

  /**
   * Update style properties in JSX element
   */
  updateStyleProperties(code, targetElement, styleUpdates) {
    if (!targetElement) {
      console.warn("No target element provided");
      return code;
    }

    const { attributes, startIndex, endIndex, fullMatch, tag } = targetElement;

    console.log("Target element:", { tag, startIndex, endIndex, attributes });
    console.log("Style updates:", styleUpdates);

    // Use robust style extraction
    const styleInfo = this.extractStyleAttribute(attributes);
    let newAttributes = attributes;

    if (styleInfo) {
      console.log("Found existing style:", styleInfo.content);

      // Update existing style
      const existingStyles = this.parseStyleString(styleInfo.content);
      console.log("Parsed existing styles:", existingStyles);

      const mergedStyles = { ...existingStyles, ...styleUpdates };
      console.log("Merged styles:", mergedStyles);

      const newStyleString = this.generateStyleString(mergedStyles);
      console.log("Generated new style string:", newStyleString);

      // Replace the entire style attribute
      newAttributes =
        attributes.substring(0, styleInfo.startIndex) +
        `style={{${newStyleString}}}` +
        attributes.substring(styleInfo.endIndex);
    } else {
      console.log("No existing style found, adding new style");
      // Add new style attribute - ensure proper spacing
      const newStyleString = this.generateStyleString(styleUpdates);
      const trimmedAttributes = attributes.trim();
      newAttributes = trimmedAttributes
        ? ` style={{${newStyleString}}} ${trimmedAttributes}`
        : ` style={{${newStyleString}}}`;
    }

    // Create the new element
    const newElement = `<${tag}${newAttributes}>`;
    console.log("Original element:", fullMatch || `<${tag}${attributes}>`);
    console.log("New element:", newElement);

    // Replace the element in the code
    const updatedCode =
      code.substring(0, startIndex) + newElement + code.substring(endIndex);

    console.log("Code replacement:");
    console.log("- Start index:", startIndex);
    console.log("- End index:", endIndex);
    console.log("- Original length:", code.length);
    console.log("- Updated length:", updatedCode.length);

    return updatedCode;
  }

  /**
   * Parse style string into object
   */
  parseStyleString(styleString) {
    const styles = {};

    // Clean up the style string - remove extra whitespace and newlines
    const cleanStyleString = styleString.replace(/\s+/g, " ").trim();
    console.log("Cleaning style string:", cleanStyleString);

    // Handle quoted values: property: 'value' or property: "value"
    const quotedPattern = /(\w+)\s*:\s*(['"`])([^'"]*?)\2[\s,]*/g;
    let quotedMatch;

    while ((quotedMatch = quotedPattern.exec(cleanStyleString)) !== null) {
      const prop = quotedMatch[1];
      const value = quotedMatch[3];
      styles[prop] = value;
      console.log(`Found quoted style: ${prop} = ${value}`);
    }

    // Handle unquoted values: property: value (numbers, etc.)
    const unquotedPattern = /(\w+)\s*:\s*([^,\s}'"]+)[\s,]*/g;
    let unquotedMatch;

    while ((unquotedMatch = unquotedPattern.exec(cleanStyleString)) !== null) {
      const prop = unquotedMatch[1];
      const value = unquotedMatch[2];

      // Only add if not already captured by quoted pattern and not a quote
      if (!styles[prop] && !value.match(/^['"`]/)) {
        styles[prop] = value;
        console.log(`Found unquoted style: ${prop} = ${value}`);
      }
    }

    console.log("Final parsed styles:", styles);
    return styles;
  }

  /**
   * Generate style string from object
   */
  generateStyleString(styles) {
    return Object.entries(styles)
      .map(([key, value]) => {
        // Handle different value types appropriately
        if (typeof value === "string") {
          // If it's already quoted or a CSS keyword, don't add quotes
          if (
            value.match(/^['"].*['"]$/) ||
            value.match(
              /^(auto|inherit|initial|unset|none|normal|bold|italic)$/i
            ) ||
            value.match(/^\d+px$|^\d+%$|^\d+em$|^\d+rem$|^\d+vh$|^\d+vw$/)
          ) {
            return `${key}: ${value}`;
          }
          // Add quotes for string values
          return `${key}: '${value}'`;
        } else if (typeof value === "number") {
          // Numbers don't need quotes
          return `${key}: ${value}`;
        } else {
          // Convert other types to string and quote them
          return `${key}: '${String(value)}'`;
        }
      })
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
   * Extract style attribute content more robustly
   */
  extractStyleAttribute(attributes) {
    // Try to find style attribute with proper brace matching
    let styleStart = attributes.indexOf("style=");
    if (styleStart === -1) return null;

    // Find the opening {{
    let openBraceStart = attributes.indexOf("{{", styleStart);
    if (openBraceStart === -1) return null;

    // Count braces to find the matching closing }}
    let braceCount = 0;
    let i = openBraceStart;
    let styleEnd = -1;

    while (i < attributes.length) {
      if (attributes.substring(i, i + 2) === "{{") {
        braceCount += 2;
        i += 2;
      } else if (attributes.substring(i, i + 2) === "}}") {
        braceCount -= 2;
        if (braceCount === 0) {
          styleEnd = i + 2;
          break;
        }
        i += 2;
      } else {
        i++;
      }
    }

    if (styleEnd === -1) return null;

    const fullStyleAttr = attributes.substring(styleStart, styleEnd);
    const styleContent = attributes.substring(openBraceStart + 2, styleEnd - 2);

    return {
      fullAttribute: fullStyleAttr,
      content: styleContent,
      startIndex: styleStart,
      endIndex: styleEnd,
    };
  }

  /**
   * Extract component structure for debugging
   */
  analyzeJSXStructure(code) {
    const elements = this.buildElementTree(code);

    return elements.map((element) => ({
      tag: element.tag,
      path: element.path,
      xpath: "//" + element.path.join("/"),
      indexedXPath:
        "//" +
        element.path
          .map((tag, i) => {
            // Count siblings at each level to provide indexed xpath
            const siblingsAtLevel = elements.filter(
              (el) =>
                el.path.length > i &&
                el.path[i] === tag &&
                this.arraysEqual(el.path.slice(0, i), element.path.slice(0, i))
            );

            const indexAtLevel = siblingsAtLevel.findIndex((el) =>
              this.arraysEqual(el.path, element.path)
            );

            return indexAtLevel > 0 ? `${tag}[${indexAtLevel + 1}]` : tag;
          })
          .join("/"),
      depth: element.depth,
      indexInParent: element.indexInParent,
      hasStyle: element.attributes.includes("style="),
      attributes: element.attributes
        .split(/\s+(?=\w+=)/)
        .filter((attr) => attr.length > 0),
      position: element.startIndex,
    }));
  }
}

module.exports = SimpleJSXUpdater;
