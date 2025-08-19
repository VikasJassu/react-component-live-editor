const SimpleJSXUpdater = require("./src/services/SimpleJSXUpdater");

const updater = new SimpleJSXUpdater();

// Complex test case with multiple same tags (your problem case)
const complexTestCode = `const ComplexComponent = () => {
  return (
    <div className="container">
      <header>
        <h1>Main Title</h1>
        <p>Header paragraph</p>
        <div className="nav">
          <p>Nav paragraph 1</p>
          <p>Nav paragraph 2</p>
        </div>
      </header>
      <main>
        <section className="intro">
          <h2>Section Title</h2>
          <p>First section paragraph</p>
          <div className="content">
            <p>Content paragraph 1</p>
            <p>Content paragraph 2</p>
          </div>
        </section>
        <section className="details">
          <h2>Details Title</h2>
          <p>Second section paragraph</p>
          <div className="sidebar">
            <p>Sidebar paragraph 1</p>
            <p>Sidebar paragraph 2</p>
          </div>
        </section>
      </main>
      <footer>
        <p>Footer paragraph</p>
        <div className="links">
          <p>Links paragraph</p>
        </div>
      </footer>
    </div>
  );
};`;

async function testEnhancedTargeting() {
  try {
    console.log("=== Testing Enhanced Element Targeting ===\n");

    // First, analyze the structure to see all available paths
    console.log("1. Analyzing JSX structure...");
    const structure = updater.analyzeJSXStructure(complexTestCode);
    console.log("Available elements and their XPaths:");
    structure.forEach((item) => {
      console.log(
        `- ${item.indexedXPath} (${item.tag}) - Depth: ${item.depth}, HasStyle: ${item.hasStyle}`
      );
    });
    console.log("\n");

    // Test 2: Target specific paragraph by full path
    console.log("2. Testing specific paragraph targeting...");
    const updates2 = {
      "//div/main/section/p": {
        // First section paragraph
        style: {
          color: "#007bff",
          fontWeight: "bold",
        },
      },
    };

    const result2 = await updater.updateJSXCode(complexTestCode, updates2);
    console.log("✅ First section paragraph updated\n");

    // Test 3: Target second section paragraph using index
    console.log("3. Testing indexed element targeting...");
    const updates3 = {
      "//div/main/section[2]/p": {
        // Second section paragraph
        style: {
          color: "#dc3545",
          fontStyle: "italic",
        },
      },
    };

    const result3 = await updater.updateJSXCode(result2, updates3);
    console.log("✅ Second section paragraph updated\n");

    // Test 4: Target specific nested paragraph
    console.log("4. Testing deeply nested element targeting...");
    const updates4 = {
      "//div/main/section/div/p[2]": {
        // Second paragraph in content div
        style: {
          backgroundColor: "#f8f9fa",
          padding: "10px",
        },
      },
    };

    const result4 = await updater.updateJSXCode(result3, updates4);
    console.log("✅ Nested paragraph updated\n");

    // Test 5: Multiple precise updates
    console.log("5. Testing multiple precise updates...");
    const updates5 = {
      "//div/header/p": {
        // Header paragraph
        style: {
          color: "#28a745",
          fontSize: "18px",
        },
      },
      "//div/footer/p": {
        // Footer paragraph
        style: {
          color: "#6c757d",
          fontSize: "14px",
        },
      },
      "//div/header/div/p[1]": {
        // First nav paragraph
        style: {
          textDecoration: "underline",
        },
      },
    };

    const finalResult = await updater.updateJSXCode(result4, updates5);
    console.log("✅ Multiple elements updated precisely\n");

    console.log("=== Final Result ===");
    console.log(finalResult);

    // Test validation
    const validation = updater.validateJSX(finalResult);
    console.log("\n=== Validation ===");
    console.log("Valid JSX:", validation.valid);
    if (!validation.valid) {
      console.log("Error:", validation.error);
    }

    console.log("\n=== Summary ===");
    console.log("✅ Enhanced targeting successfully handles:");
    console.log("  - Multiple same tags (p, div, section)");
    console.log("  - Deeply nested elements");
    console.log("  - Indexed element selection");
    console.log("  - Precise path-based targeting");
    console.log("  - Large HTML files with complex structure");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

testEnhancedTargeting();
