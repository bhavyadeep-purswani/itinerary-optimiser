// API service for Anthropic integration
export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicRequest {
  messages: AnthropicMessage[];
  model?: string;
  max_tokens?: number;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

const API_BASE_URL = "http://localhost:3001";

export const anthropicService = {
  async sendMessage(
    messages: AnthropicMessage[],
    options?: Partial<AnthropicRequest>
  ): Promise<AnthropicResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/anthropic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model: options?.model || "claude-3-5-sonnet-20241022",
          max_tokens: options?.max_tokens || 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API Error: ${errorData.error || "Unknown error occurred"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Anthropic API call failed:", error);
      throw error;
    }
  },

  async generateItinerary(
    attractions: string[],
    duration: number,
    travelers: number
  ): Promise<string> {
    const prompt = `Create a detailed itinerary for ${duration} days in Paris for ${travelers} travelers. 
    Include these attractions: ${attractions.join(", ")}.
    
    Please provide:
    1. Day-by-day schedule
    2. Time recommendations for each attraction
    3. Travel tips between locations
    4. Estimated costs
    5. Best times to visit each attraction
    
    Format the response in a clear, easy-to-read structure.`;

    const response = await this.sendMessage([
      { role: "user", content: prompt },
    ]);

    return response.content[0]?.text || "No response generated";
  },
};
