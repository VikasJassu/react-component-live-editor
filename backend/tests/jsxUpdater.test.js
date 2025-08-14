const JSXUpdaterService = require("../src/services/JSXUpdaterService");

describe("JSXUpdaterService", () => {
  let jsxUpdater;

  beforeEach(() => {
    jsxUpdater = new JSXUpdaterService();
  });

  describe("updateJSXCode", () => {
    it("should update style properties in JSX", async () => {
      const originalCode = `
        function TestComponent() {
          return (
            <div>
              <h1>Hello World</h1>
              <p>This is a test</p>
            </div>
          );
        }
      `;

      const updates = {
        "//div/h1": {
          style: {
            color: "#ff0000",
            fontSize: "24px",
          },
        },
      };

      const updatedCode = await jsxUpdater.updateJSXCode(originalCode, updates);

      expect(updatedCode).toContain("color: '#ff0000'");
      expect(updatedCode).toContain("fontSize: '24px'");
    });

    it("should update text content in JSX", async () => {
      const originalCode = `
        function TestComponent() {
          return (
            <div>
              <h1>Hello World</h1>
            </div>
          );
        }
      `;

      const updates = {
        "//div/h1": {
          textContent: "Updated Title",
        },
      };

      const updatedCode = await jsxUpdater.updateJSXCode(originalCode, updates);

      expect(updatedCode).toContain("Updated Title");
      expect(updatedCode).not.toContain("Hello World");
    });

    it("should handle invalid JSX gracefully", async () => {
      const invalidCode =
        "function TestComponent() { return <div><h1>Unclosed tag; }";

      await expect(jsxUpdater.updateJSXCode(invalidCode, {})).rejects.toThrow(
        "Failed to update JSX code"
      );
    });
  });

  describe("validateJSX", () => {
    it("should validate correct JSX", () => {
      const validCode = "function TestComponent() { return <div>Hello</div>; }";
      const result = jsxUpdater.validateJSX(validCode);

      expect(result.valid).toBe(true);
    });

    it("should detect invalid JSX", () => {
      const invalidCode = "function TestComponent() { return <div>Unclosed; }";
      const result = jsxUpdater.validateJSX(invalidCode);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("analyzeJSXStructure", () => {
    it("should analyze JSX structure correctly", () => {
      const code = `
        function TestComponent() {
          return (
            <div>
              <h1>Title</h1>
              <p>Content</p>
            </div>
          );
        }
      `;

      const structure = jsxUpdater.analyzeJSXStructure(code);

      expect(structure).toHaveLength(3); // div, h1, p
      expect(structure[0].tag).toBe("div");
      expect(structure[1].tag).toBe("h1");
      expect(structure[2].tag).toBe("p");
    });
  });
});
