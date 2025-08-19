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

    // Test simple update
    const updates = {
      "//div/p": {
        style: {
          color: "red",
          fontWeight: "bold",
        },
      },
    };

    console.log("Applying updates:", updates);
    console.log("\n");

    const result = await updater.updateJSXCode(simpleTestCode, updates);

    console.log("\n=== RESULT ===");
    console.log("Updated code:");
    console.log(result);

    console.log("\n=== COMPARISON ===");
    console.log("Original === Updated:", simpleTestCode === result);
    console.log(
      "Length - Original:",
      simpleTestCode.length,
      "Updated:",
      result.length
    );
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

debugUpdater();
