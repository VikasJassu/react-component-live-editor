const SimpleJSXUpdater = require("./src/services/SimpleJSXUpdater");

// Test the JSX updater fix for missing > symbol
async function testJSXUpdaterFix() {
  const updater = new SimpleJSXUpdater();

  console.log("🧪 Testing JSX Updater Fix for Missing > Symbol...\n");

  // Test: Update both style and text content
  console.log("Test: Update both style and text content");
  const code = `<div><h1>Original Title</h1><p>Original content</p></div>`;

  const updates = {
    "//div/h1": {
      style: {
        color: "#ff0000",
        fontSize: "24px",
      },
      textContent: "Updated Title",
    },
  };

  try {
    const result = await updater.updateJSXCode(code, updates);
    console.log("✅ Update successful");
    console.log("Original code:", code);
    console.log("Updated code:", result);

    // Check if the result has proper HTML tags
    const hasProperTags =
      result.includes("<h1") && result.includes(">Updated Title</h1>");
    const hasStyle =
      result.includes("style={{") && result.includes("color: '#ff0000'");

    if (hasProperTags && hasStyle) {
      console.log("✅ All checks passed - no missing > symbol");
    } else {
      console.log("❌ Issues found:");
      if (!hasProperTags) console.log("  - Missing proper HTML tags");
      if (!hasStyle) console.log("  - Missing style attributes");
    }
  } catch (error) {
    console.log("❌ Update failed:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Multiple elements
  console.log("Test 2: Multiple elements with same tag");
  const code2 = `<div><h1>First</h1><h1>Second</h1><p>Content</p></div>`;

  const updates2 = {
    "//div/h1[2]": {
      style: {
        color: "#00ff00",
      },
      textContent: "Updated Second",
    },
  };

  try {
    const result2 = await updater.updateJSXCode(code2, updates2);
    console.log("✅ Multiple elements update successful");
    console.log("Original code:", code2);
    console.log("Updated code:", result2);

    // Check if only the second h1 was updated
    const hasFirstUnchanged = result2.includes(">First</h1>");
    const hasSecondUpdated =
      result2.includes(">Updated Second</h1>") &&
      result2.includes("color: '#00ff00'");

    if (hasFirstUnchanged && hasSecondUpdated) {
      console.log("✅ Correct element targeting - only second h1 updated");
    } else {
      console.log("❌ Element targeting issues");
    }
  } catch (error) {
    console.log("❌ Multiple elements update failed:", error.message);
  }

  console.log("\n🎉 JSX Updater fix test completed!");
}

// Run the test
testJSXUpdaterFix().catch(console.error);
