import type { ElementProperties } from "../types";

export interface SaveComponentRequest {
  code: string;
  properties: Record<string, ElementProperties>;
  title?: string;
  description?: string;
}

export interface SaveComponentResponse {
  id: string;
  url: string;
  shareUrl: string;
  code: string;
}

export interface LoadComponentResponse {
  id: string;
  code: string;
  properties: Record<string, ElementProperties>;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentListItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentListResponse {
  components: ComponentListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  async saveComponent(
    componentData: SaveComponentRequest
  ): Promise<SaveComponentResponse> {
    const response = await this.request<{
      success: boolean;
      data: SaveComponentResponse;
    }>("/components/save", {
      method: "POST",
      body: JSON.stringify(componentData),
    });
    return response.data;
  }

  async loadComponent(id: string): Promise<LoadComponentResponse> {
    const response = await this.request<{
      success: boolean;
      data: LoadComponentResponse;
    }>(`/components/${id}`);
    return response.data;
  }

  async updateComponent(
    id: string,
    updates: Partial<SaveComponentRequest>
  ): Promise<LoadComponentResponse> {
    const response = await this.request<{
      success: boolean;
      data: LoadComponentResponse;
    }>(`/components/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async deleteComponent(id: string): Promise<void> {
    await this.request<{ success: boolean; message: string }>(
      `/components/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  async listComponents(page = 1, limit = 10): Promise<ComponentListResponse> {
    const response = await this.request<{
      success: boolean;
      data: ComponentListItem[];
      pagination: ComponentListResponse["pagination"];
    }>(`/components?page=${page}&limit=${limit}`);
    return {
      components: response.data,
      pagination: response.pagination,
    };
  }

  async searchComponents(
    query: string,
    page = 1,
    limit = 10
  ): Promise<ComponentListResponse> {
    const response = await this.request<{
      success: boolean;
      data: ComponentListItem[];
      pagination: ComponentListResponse["pagination"];
    }>(
      `/components/search?q=${encodeURIComponent(
        query
      )}&page=${page}&limit=${limit}`
    );
    return {
      components: response.data,
      pagination: response.pagination,
    };
  }

  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> {
    // Health check uses a different base URL (without /api)
    const healthUrl = this.baseUrl.replace("/api", "") + "/health";
    const response = await fetch(healthUrl);
    return response.json();
  }
}

export const apiService = new ApiService();
