const SimpleJSXUpdater = require("./src/services/SimpleJSXUpdater");

const updater = new SimpleJSXUpdater();

// Simple test case to debug the issue
const simpleTestCode = `<div>
  <p style={{ color: 'black', fontSize: '16px' }}>
    Original text
  </p>
</div>`;

async function debugUpdater() {
  try {
    console.log("=== Debugging Simple JSX Updater ===\n");

    console.log("Original code:");
    console.log(simpleTestCode);
    console.log("\n");

    // Test 1: Simple update
    console.log("TEST 1: Simple paragraph update");
    const updates1 = {
      "//p": {
        style: {
          color: "red",
          fontWeight: "bold",
        },
      },
    };

    console.log("Applying updates:", updates1);
    const result1 = await updater.updateJSXCode(simpleTestCode, updates1);

    console.log("\n=== RESULT 1 ===");
    console.log("Updated code:");
    console.log(result1);
    console.log("Changed:", simpleTestCode !== result1);

    // Test 2: Path-based update
    console.log("\n\nTEST 2: Path-based update");
    const updates2 = {
      "//div/p": {
        style: {
          backgroundColor: "yellow",
          padding: "10px",
        },
      },
    };

    console.log("Applying updates:", updates2);
    const result2 = await updater.updateJSXCode(simpleTestCode, updates2);

    console.log("\n=== RESULT 2 ===");
    console.log("Updated code:");
    console.log(result2);
    console.log("Changed:", simpleTestCode !== result2);

    // Test 3: Analyze structure
    console.log("\n\nTEST 3: Structure analysis");
    const structure = updater.analyzeJSXStructure(simpleTestCode);
    console.log("Structure:", structure);
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

debugUpdater();
