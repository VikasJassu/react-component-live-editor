import * as Babel from "@babel/standalone";
import React from "react";
import type { CompilationError } from "../types";

export class JSXCompiler {
  private static instance: JSXCompiler;

  private constructor() {
    // Babel is already configured with default presets
  }

  public static getInstance(): JSXCompiler {
    if (!JSXCompiler.instance) {
      JSXCompiler.instance = new JSXCompiler();
    }
    return JSXCompiler.instance;
  }

  public validateJSX(code: string): CompilationError | null {
    try {
      let testCode = code.trim();

      // If it's not a complete function, wrap it for validation
      const isFunctionComponent =
        testCode.includes("function") && testCode.includes("return");

      const isArrowComponent =
        testCode.includes("const") &&
        testCode.includes("=>") &&
        testCode.includes("return");

      if (!isFunctionComponent && !isArrowComponent) {
        testCode = `function TestComponent() { return (${testCode}); }`;
      }

      // Basic validation - try to parse the code
      Babel.transform(testCode, {
        presets: ["react"],
        filename: "component.jsx",
      });
      return null;
    } catch (error: any) {
      return {
        message: error.message || "Compilation error",
        line: error.loc?.line,
        column: error.loc?.column,
        type: "babel",
      };
    }
  }

  public async compileJSX(code: string): Promise<React.ComponentType> {
    try {
      // Validate first
      const validationError = this.validateJSX(code);
      if (validationError) {
        throw new Error(validationError.message);
      }

      let wrappedCode = code.trim();
      let componentName = "Component";

      // Check if it's already a complete function component
      const isFunctionComponent =
        wrappedCode.includes("function") &&
        wrappedCode.includes("return") &&
        wrappedCode.includes("(") &&
        wrappedCode.includes(")");

      const isArrowComponent =
        wrappedCode.includes("const") &&
        wrappedCode.includes("=>") &&
        wrappedCode.includes("return");

      if (isFunctionComponent) {
        // Extract function name if it exists
        const functionMatch = wrappedCode.match(/function\s+(\w+)/);
        if (functionMatch) {
          componentName = functionMatch[1];
        }
      } else if (isArrowComponent) {
        // Extract const name if it exists
        const constMatch = wrappedCode.match(/const\s+(\w+)/);
        if (constMatch) {
          componentName = constMatch[1];
        }
      } else {
        // It's just JSX, wrap it in a function component
        wrappedCode = `function Component() { return (${wrappedCode}); }`;
        componentName = "Component";
      }

      // Transform JSX to JavaScript
      const result = Babel.transform(wrappedCode, {
        presets: ["react"],
        filename: "component.jsx",
      });

      if (!result.code) {
        throw new Error("Compilation failed - no output generated");
      }

      // Create a function that returns the component
      const componentCode = `
        const React = arguments[0];
        const { useState, useEffect, useCallback, useMemo, useRef } = React;
        ${result.code}
        return ${componentName};
      `;

      // Create and execute the function
      const componentFactory = new Function(componentCode);
      const Component = componentFactory(React);

      // Ensure we return a valid React component
      if (typeof Component !== "function") {
        throw new Error(
          "Compiled code did not produce a valid React component"
        );
      }

      return Component;
    } catch (error: any) {
      throw new Error(`Compilation failed: ${error.message}`);
    }
  }
}
