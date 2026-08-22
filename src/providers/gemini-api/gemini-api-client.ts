export interface GeminiModel {
  name: string;
  displayName?: string;
}

export class GeminiApiClient {
  private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "x-goog-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Gemini API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getModels(): Promise<GeminiModel[]> {
    const response = await this.request<{
      models?: GeminiModel[];
    }>("/models");

    return response.models ?? [];
  }
}
