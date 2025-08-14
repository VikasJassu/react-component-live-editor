const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");

const ComponentService = require("../services/ComponentService");
const SimpleJSXUpdater = require("../services/SimpleJSXUpdater");
const { validateJSX, sanitizeProperties } = require("../utils/validation");

const router = express.Router();
const componentService = new ComponentService();
const jsxUpdaterService = new SimpleJSXUpdater();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

/**
 * POST /api/components/save
 * Save a React component with its properties
 */
router.post(
  "/save",
  [
    body("code")
      .isString()
      .isLength({ min: 1, max: 50000 })
      .withMessage("Code must be a string between 1 and 50000 characters")
      .custom(validateJSX),
    body("properties")
      .optional()
      .isObject()
      .withMessage("Properties must be an object")
      .custom(sanitizeProperties),
    body("title")
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("Title must be a string with max 100 characters"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Description must be a string with max 500 characters"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { code, properties = {}, title, description } = req.body;

      // Update JSX code with properties if any properties are provided
      let updatedCode = code;
      if (Object.keys(properties).length > 0) {
        try {
          // Convert properties to XPath-based updates
          const xpathUpdates = {};
          for (const [pathKey, props] of Object.entries(properties)) {
            // If pathKey looks like an XPath, use it directly
            if (pathKey.startsWith("//") || pathKey.includes("/")) {
              console.log("x path element", props);
              xpathUpdates[pathKey] = props;
            }
          }

          if (Object.keys(xpathUpdates).length > 0) {
            updatedCode = await jsxUpdaterService.updateJSXCode(
              code,
              xpathUpdates
            );
          }
        } catch (updateError) {
          console.warn(
            "Failed to update JSX code with properties:",
            updateError.message
          );
          // Continue with original code if update fails
        }
      }

      const componentData = {
        id: uuidv4(),
        code: updatedCode,
        originalCode: code, // Keep original for reference
        properties,
        title: title || "Untitled Component",
        description: description || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const savedComponent = await componentService.save(componentData);

      res.status(201).json({
        success: true,
        data: {
          id: savedComponent.id,
          code: updatedCode, // Return the updated code
          url: `${req.protocol}://${req.get("host")}/api/components/${
            savedComponent.id
          }`,
          shareUrl: `${req.protocol}://${req.get("host")}/share/${
            savedComponent.id
          }`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/components/:id
 * Load a saved React component by ID
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid component ID format")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const component = await componentService.findById(id);

      if (!component) {
        return res.status(404).json({
          error: "Component not found",
          message: "The requested component does not exist or has been deleted",
        });
      }

      res.json({
        success: true,
        data: {
          id: component.id,
          code: component.code,
          properties: component.properties,
          title: component.title,
          description: component.description,
          createdAt: component.createdAt,
          updatedAt: component.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/components/:id
 * Update an existing React component
 */
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid component ID format"),
    body("code")
      .optional()
      .isString()
      .isLength({ min: 1, max: 50000 })
      .withMessage("Code must be a string between 1 and 50000 characters")
      .custom(validateJSX),
    body("properties")
      .optional()
      .isObject()
      .withMessage("Properties must be an object")
      .custom(sanitizeProperties),
    body("title")
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("Title must be a string with max 100 characters"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("Description must be a string with max 500 characters"),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingComponent = await componentService.findById(id);
      if (!existingComponent) {
        return res.status(404).json({
          error: "Component not found",
          message: "The requested component does not exist or has been deleted",
        });
      }

      // Update JSX code with properties if provided
      let updatedCode = updates.code || existingComponent.code;
      if (updates.properties && Object.keys(updates.properties).length > 0) {
        try {
          // Convert properties to XPath-based updates
          const xpathUpdates = {};
          for (const [pathKey, props] of Object.entries(updates.properties)) {
            // If pathKey looks like an XPath, use it directly
            if (pathKey.startsWith("//") || pathKey.includes("/")) {
              xpathUpdates[pathKey] = props;
            }
          }

          if (Object.keys(xpathUpdates).length > 0) {
            updatedCode = await jsxUpdaterService.updateJSXCode(
              updatedCode,
              xpathUpdates
            );
          }
        } catch (updateError) {
          console.warn(
            "Failed to update JSX code with properties:",
            updateError.message
          );
          // Continue with original code if update fails
        }
      }

      const updatedComponent = await componentService.update(id, {
        ...updates,
        code: updatedCode,
        originalCode: updates.code || existingComponent.originalCode,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        data: {
          id: updatedComponent.id,
          code: updatedCode, // Return the updated code
          properties: updatedComponent.properties,
          title: updatedComponent.title,
          description: updatedComponent.description,
          createdAt: updatedComponent.createdAt,
          updatedAt: updatedComponent.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/components/:id
 * Delete a React component
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid component ID format")],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const deleted = await componentService.delete(id);

      if (!deleted) {
        return res.status(404).json({
          error: "Component not found",
          message: "The requested component does not exist or has been deleted",
        });
      }

      res.json({
        success: true,
        message: "Component deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/components
 * List all components (with pagination)
 */
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const result = await componentService.findAll({ limit, offset });

    res.json({
      success: true,
      data: result.components.map((component) => ({
        id: component.id,
        title: component.title,
        description: component.description,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
