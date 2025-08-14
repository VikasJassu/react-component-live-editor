const SimpleJSXUpdater = require("./src/services/SimpleJSXUpdater");

// Test the JSX updater
async function testJSXUpdater() {
  const updater = new SimpleJSXUpdater();

  console.log("🧪 Testing SimpleJSXUpdater...\n");

  // Test 1: Basic style update
  console.log("Test 1: Basic style update");
  const code1 = `function Counter() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <h1>React Counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`;

  const updates1 = {
    "//div/h1": {
      style: {
        color: "#ff0000",
        fontSize: "24px",
      },
    },
  };

  try {
    const result1 = await updater.updateJSXCode(code1, updates1);
    console.log("✅ Style update successful");
    console.log(
      "Updated code snippet:",
      result1.substring(result1.indexOf("<h1"), result1.indexOf("</h1>") + 5)
    );
  } catch (error) {
    console.log("❌ Style update failed:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Text content update
  console.log("Test 2: Text content update");
  const code2 = `<div><h1>Hello World</h1><p>This is a test</p></div>`;

  const updates2 = {
    "//div/h1": {
      textContent: "Updated Title",
    },
  };

  try {
    const result2 = await updater.updateJSXCode(code2, updates2);
    console.log("✅ Text content update successful");
    console.log("Updated code:", result2);
  } catch (error) {
    console.log("❌ Text content update failed:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 3: JSX validation
  console.log("Test 3: JSX validation");
  const validCode = "<div><h1>Valid JSX</h1></div>";
  const invalidCode = "<div><h1>Invalid JSX</div>";

  const validation1 = updater.validateJSX(validCode);
  const validation2 = updater.validateJSX(invalidCode);

  console.log("Valid JSX result:", validation1);
  console.log("Invalid JSX result:", validation2);

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 4: Structure analysis
  console.log("Test 4: Structure analysis");
  const structure = updater.analyzeJSXStructure(code1);
  console.log("JSX Structure:", structure.slice(0, 3)); // Show first 3 elements

  console.log("\n🎉 All tests completed!");
}

// Run the test
testJSXUpdater().catch(console.error);
