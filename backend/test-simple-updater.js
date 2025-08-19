const SimpleJSXUpdater = require("./src/services/SimpleJSXUpdater");

const updater = new SimpleJSXUpdater();

// Test case with multi-line JSX (your problem case)
const testCode = `const BlogPost = () => {
  return (
    <article
      style={{
        maxWidth: 720,
        margin: "40px auto",
        padding: "24px",
        borderRadius: 12,
        border: "1px solid #ececec",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        background: "#fff",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.25 }}>
          Designing Simple Interfaces
        </h1>
        <p style={{ margin: "6px 0 0", color: "#555" }}>
          Why clarity beats complexity in everyday products
        </p>
      </header>
      <section style={{ color: "#222", fontSize: 18 }}>
        <p style={{ marginTop: 0 }}>
          Simplicity in design isn't about removing features—it's about revealing
          intent.
        </p>
      </section>
    </article>
  );
};`;

async function testSimpleUpdater() {
  try {
    console.log("=== Testing Simple JSX Updater Fixes ===\n");

    // Test 1: Update article background (multi-line style object)
    console.log("1. Testing article background update...");
    const updates1 = {
      "//article": {
        style: {
          backgroundColor: "#f8f9fa",
          border: "2px solid #007bff",
        },
      },
    };

    const result1 = await updater.updateJSXCode(testCode, updates1);
    console.log("✅ Article update completed\n");

    // Test 2: Update h1 styles
    console.log("2. Testing h1 style update...");
    const updates2 = {
      "//h1": {
        style: {
          color: "#007bff",
          fontSize: "36px",
        },
      },
    };

    const result2 = await updater.updateJSXCode(result1, updates2);
    console.log("✅ H1 update completed\n");

    // Test 3: Update section paragraph (your specific problem)
    console.log("3. Testing section paragraph update (your main issue)...");
    const updates3 = {
      "//p": {
        style: {
          color: "#dc3545",
          fontSize: "20px",
        },
      },
    };

    const result3 = await updater.updateJSXCode(result2, updates3);
    console.log("✅ Paragraph update completed\n");

    console.log("=== Final Result ===");
    console.log(result3);

    // Test validation
    const validation = updater.validateJSX(result3);
    console.log("\n=== Validation ===");
    console.log("Valid JSX:", validation.valid);
    if (!validation.valid) {
      console.log("Error:", validation.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

testSimpleUpdater();
