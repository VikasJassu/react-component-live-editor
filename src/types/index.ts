// Core TypeScript interfaces for React Live Inspector

export interface ElementPath {
  indices: number[];
  elementType: string;
  key?: string;
  xpath: string;
  selector: string;
}

export interface ElementProperties {
  textContent?: string;
  style: {
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
  };
}

export interface CompilationError {
  message: string;
  line?: number;
  column?: number;
  type: "syntax" | "runtime" | "babel";
}

export interface AppState {
  jsxCode: string;
  compiledComponent: React.ComponentType | null;
  selectedElement: ElementPath | null;
  elementProperties: Map<string, ElementProperties>;
  compilationError: CompilationError | null;
  isLoading: boolean;
  savedComponentId?: string;
}

// API Data Models (for future backend integration)
export interface SaveComponentRequest {
  code: string;
  properties: Record<string, ElementProperties>;
}

export interface SaveComponentResponse {
  id: string;
  url: string;
}

export interface LoadComponentResponse {
  code: string;
  properties: Record<string, ElementProperties>;
}
