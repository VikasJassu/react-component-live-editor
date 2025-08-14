const express = require("express");
const cors = require("cors");
const path = require("path");

// Simple server without complex dependencies
const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Simple in-memory storage
let components = [];
let componentIdCounter = 1;

// Simple JSX updater (inline)
class SimpleJSXUpdater {
  async updateJSXCode(code, updates) {
    console.log("Updating JSX code with updates:", updates);

    let updatedCode = code;

    // Simple string replacement approach for demonstration
    for (const [xpath, properties] of Object.entries(updates)) {
      // Handle style updates
      if (properties.style) {
        // Find the first JSX element and add/update style
        const elementMatch = updatedCode.match(/<(\w+)([^>]*?)>/);
        if (elementMatch) {
          const [fullMatch, tagName, attributes] = elementMatch;

          // Generate style string
          const styleString = Object.entries(properties.style)
            .map(([key, value]) => `${key}: '${value}'`)
            .join(", ");

          let newElement;
          // Check if style already exists
          if (attributes.includes("style=")) {
            // Update existing style (simple replacement)
            const newAttributes = attributes.replace(
              /style=\{\{[^}]*\}\}/,
              `style={{${styleString}}}`
            );
            newElement = `<${tagName}${newAttributes}>`;
          } else {
            // Add new style - ensure proper spacing
            const trimmedAttributes = attributes.trim();
            const newAttributes = trimmedAttributes
              ? ` style={{${styleString}}} ${trimmedAttributes}`
              : ` style={{${styleString}}}`;
            newElement = `<${tagName}${newAttributes}>`;
          }

          updatedCode = updatedCode.replace(fullMatch, newElement);
        }
      }

      // Handle text content updates (after style updates)
      if (properties.textContent !== undefined) {
        // Find the first text content and replace it
        updatedCode = updatedCode.replace(
          />([^<]+)</,
          `>${properties.textContent}<`
        );
      }
    }

    return updatedCode;
  }
}

const jsxUpdater = new SimpleJSXUpdater();

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Save component
app.post("/api/components/save", async (req, res) => {
  try {
    const { code, properties = {}, title, description } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "Code is required and must be a string",
      });
    }

    // Update JSX code with properties if any
    let updatedCode = code;
    if (Object.keys(properties).length > 0) {
      try {
        updatedCode = await jsxUpdater.updateJSXCode(code, properties);
        console.log("Code updated successfully");
      } catch (updateError) {
        console.warn("Failed to update JSX code:", updateError.message);
        // Continue with original code
      }
    }

    const component = {
      id: `comp-${componentIdCounter++}`,
      code: updatedCode,
      originalCode: code,
      properties,
      title: title || "Untitled Component",
      description: description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    components.push(component);

    res.status(201).json({
      success: true,
      data: {
        id: component.id,
        code: updatedCode,
        url: `http://localhost:${PORT}/api/components/${component.id}`,
        shareUrl: `http://localhost:${PORT}/share/${component.id}`,
      },
    });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Load component
app.get("/api/components/:id", (req, res) => {
  try {
    const { id } = req.params;
    const component = components.find((c) => c.id === id);

    if (!component) {
      return res.status(404).json({
        success: false,
        error: "Component not found",
      });
    }

    res.json({
      success: true,
      data: component,
    });
  } catch (error) {
    console.error("Load error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Update component
app.put("/api/components/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, properties = {}, title, description } = req.body;

    const componentIndex = components.findIndex((c) => c.id === id);

    if (componentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Component not found",
      });
    }

    const existingComponent = components[componentIndex];

    // Update JSX code with properties if any
    let updatedCode = code || existingComponent.code;
    if (Object.keys(properties).length > 0) {
      try {
        updatedCode = await jsxUpdater.updateJSXCode(updatedCode, properties);
        console.log("Code updated successfully during update");
      } catch (updateError) {
        console.warn("Failed to update JSX code:", updateError.message);
        // Continue with original code
      }
    }

    // Update the component
    const updatedComponent = {
      ...existingComponent,
      code: updatedCode,
      originalCode: code || existingComponent.originalCode,
      properties: properties || existingComponent.properties,
      title: title || existingComponent.title,
      description: description || existingComponent.description,
      updatedAt: new Date().toISOString(),
    };

    components[componentIndex] = updatedComponent;

    res.json({
      success: true,
      data: {
        id: updatedComponent.id,
        code: updatedCode,
        properties: updatedComponent.properties,
        title: updatedComponent.title,
        description: updatedComponent.description,
        createdAt: updatedComponent.createdAt,
        updatedAt: updatedComponent.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// List components
app.get("/api/components", (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const paginatedComponents = components
      .slice(offset, offset + limit)
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

    res.json({
      success: true,
      data: paginatedComponents,
      pagination: {
        page,
        limit,
        total: components.length,
        pages: Math.ceil(components.length / limit),
      },
    });
  } catch (error) {
    console.error("List error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 React Live Inspector Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💾 Using in-memory storage (${components.length} components)`);
});

module.exports = app;
