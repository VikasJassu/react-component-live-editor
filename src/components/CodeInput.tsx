import React from "react";
import "./CodeInput.css";

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onPreview: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  value,
  onChange,
  onPreview,
  isLoading = false,
  error,
}) => {
  return (
    <div className="code-input">
      <div className="code-input-header">
        <h3>JSX Code</h3>
        <button
          onClick={onPreview}
          disabled={isLoading}
          className="preview-button"
        >
          {isLoading ? "Compiling..." : "Preview"}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your JSX code here..."
        className="code-textarea"
        spellCheck={false}
        rows={15}
      />

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
