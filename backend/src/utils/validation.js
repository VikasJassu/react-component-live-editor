const { CustomValidator } = require("express-validator");

/**
 * Validate JSX code for basic safety and syntax
 */
const validateJSX = (code) => {
  if (typeof code !== "string") {
    throw new Error("Code must be a string");
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /document\.write/i,
    /innerHTML\s*=/i,
    /outerHTML\s*=/i,
    /dangerouslySetInnerHTML/i,
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Potentially unsafe code detected: ${pattern.source}`);
    }
  }

  // Check for basic JSX structure
  if (!code.includes("<") || !code.includes(">")) {
    throw new Error("Code must contain valid JSX elements");
  }

  // Check for balanced brackets (basic check)
  const openBrackets = (code.match(/</g) || []).length;
  const closeBrackets = (code.match(/>/g) || []).length;

  if (openBrackets === 0 || closeBrackets === 0) {
    throw new Error("JSX must contain properly formed elements");
  }

  return true;
};

/**
 * Sanitize and validate element properties
 */
const sanitizeProperties = (properties) => {
  if (typeof properties !== "object" || properties === null) {
    throw new Error("Properties must be an object");
  }

  const allowedStyleProperties = [
    "color",
    "backgroundColor",
    "fontSize",
    "fontWeight",
    "fontFamily",
    "padding",
    "margin",
    "borderRadius",
    "border",
    "width",
    "height",
    "display",
    "textAlign",
    "lineHeight",
    "opacity",
    "transform",
    "boxShadow",
    "textDecoration",
    "textTransform",
  ];

  const sanitized = {};

  for (const [elementPath, elementProps] of Object.entries(properties)) {
    if (typeof elementProps !== "object" || elementProps === null) {
      continue;
    }

    const sanitizedProps = {};

    // Sanitize text content
    if (elementProps.textContent !== undefined) {
      if (typeof elementProps.textContent === "string") {
        // Remove potentially dangerous HTML/JS
        sanitizedProps.textContent = elementProps.textContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "");
      }
    }

    // Sanitize style properties
    if (elementProps.style && typeof elementProps.style === "object") {
      const sanitizedStyle = {};

      for (const [styleProp, styleValue] of Object.entries(
        elementProps.style
      )) {
        if (
          allowedStyleProperties.includes(styleProp) &&
          typeof styleValue === "string"
        ) {
          // Remove potentially dangerous CSS values
          const cleanValue = styleValue
            .replace(/javascript:/gi, "")
            .replace(/expression\s*\(/gi, "")
            .replace(/url\s*\(\s*javascript:/gi, "")
            .replace(/@import/gi, "");

          // Basic CSS value validation
          if (cleanValue.length <= 200 && !cleanValue.includes("<script")) {
            sanitizedStyle[styleProp] = cleanValue;
          }
        }
      }

      if (Object.keys(sanitizedStyle).length > 0) {
        sanitizedProps.style = sanitizedStyle;
      }
    }

    if (Object.keys(sanitizedProps).length > 0) {
      sanitized[elementPath] = sanitizedProps;
    }
  }

  return true;
};

/**
 * Validate component metadata
 */
const validateComponentMetadata = (metadata) => {
  const { title, description, tags } = metadata;

  if (title !== undefined) {
    if (typeof title !== "string" || title.length > 100) {
      throw new Error("Title must be a string with maximum 100 characters");
    }
  }

  if (description !== undefined) {
    if (typeof description !== "string" || description.length > 500) {
      throw new Error(
        "Description must be a string with maximum 500 characters"
      );
    }
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > 10) {
      throw new Error("Tags must be an array with maximum 10 items");
    }

    for (const tag of tags) {
      if (typeof tag !== "string" || tag.length > 20) {
        throw new Error("Each tag must be a string with maximum 20 characters");
      }
    }
  }

  return true;
};

/**
 * Rate limiting helper
 */
const createRateLimitKey = (req) => {
  return `${req.ip}:${req.route.path}`;
};

module.exports = {
  validateJSX,
  sanitizeProperties,
  validateComponentMetadata,
  createRateLimitKey,
};
