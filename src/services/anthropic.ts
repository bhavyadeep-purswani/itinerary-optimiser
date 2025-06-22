// API service for Anthropic integration
export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicRequest {
  messages: AnthropicMessage[];
  model?: string;
  max_tokens?: number;
  mcp_servers?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
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

// Dynamic API base URL for development and production
const API_BASE_URL = import.meta.env.PROD
  ? "" // Use relative URLs in production (same domain)
  : "http://localhost:3001"; // Use localhost in development

const API_TIMEOUT = 5000; // 5 seconds timeout

// Backup itinerary response for API failures
const BACKUP_ITINERARY = {
  itinerary: {
    day1: {
      morning: {
        timeSlot: "09:00-12:00",
        experienceId: 3909,
        vendorId: "headout",
        tourId: 3909,
        variantId: 3909,
        tourGroupName:
          "Louvre Museum Reserved Access Tickets with Optional Audioguide",
        variantName: "Reserved Access with Audio Guide",
        duration: "3h",
        location: "Louvre Museum, 75001 Paris",
        notes:
          "Start early to avoid crowds. Reserved time entry ensures smooth access. Use audio guide for enhanced experience.",
      },
      afternoon: {
        timeSlot: "14:00-16:00",
        experienceId: 6235,
        vendorId: "headout",
        tourId: 6235,
        variantId: 6235,
        tourGroupName: "Orsay Museum Fast-Track Tickets",
        variantName: "Fast-Track Entry",
        duration: "2h",
        location: "Orsay Museum, 1 Rue de la Légion d'Honneur, 75007 Paris",
        notes:
          "Perfect timing after lunch. Focus on Impressionist masterpieces by Monet, Renoir, and Van Gogh.",
      },
      evening: {
        timeSlot: "17:30-19:30",
        experienceId: 23604,
        vendorId: "headout",
        tourId: 23604,
        variantId: 23604,
        tourGroupName:
          "Eiffel Tower Guided Tour by Elevator: Summit or Second Floor",
        variantName: "Guided Tour to Summit",
        duration: "2h",
        location: "Eiffel Tower, Champ de Mars, 75007 Paris",
        notes:
          "Evening slot offers beautiful lighting and city views. Small group tour with expert guide.",
      },
    },
    day2: {
      morning: {
        timeSlot: "10:00-12:00",
        experienceId: 8008,
        vendorId: "headout",
        tourId: 8008,
        variantId: 8008,
        tourGroupName: "Sainte-Chapelle and Conciergerie Tickets",
        variantName: "Combined Entry Tickets",
        duration: "2h",
        location: "Sainte-Chapelle, 10 Bd du Palais, 75001 Paris",
        notes:
          "Morning light enhances the stunning stained glass windows. Combined ticket covers both historic sites.",
      },
      afternoon: {
        timeSlot: "14:30-16:30",
        experienceId: 8006,
        vendorId: "headout",
        tourId: 8006,
        variantId: 8006,
        tourGroupName: "Self-guided tour of Palais Garnier",
        variantName: "Timed Entry Ticket",
        duration: "2h",
        location: "Opera Garnier, Pl. de l'Opéra, 75009 Paris",
        notes:
          "Timed entry ensures access to this architectural masterpiece. Explore at your own pace with included access to temporary exhibitions.",
      },
      evening: {
        timeSlot: "",
        experienceId: 0,
        vendorId: "",
        tourId: 0,
        variantId: 0,
        tourGroupName: "",
        variantName: "",
        duration: "",
        location: "",
        notes: "",
      },
    },
    optimizationNotes: {
      crowdAvoidance:
        "Scheduled early morning starts at major attractions and strategic afternoon timing to minimize wait times. Reserved entry tickets eliminate queuing.",
      logistics:
        "Geographically clustered attractions by day - Day 1 focuses on Left Bank museums and Eiffel Tower area, Day 2 covers Île de la Cité and Opera district for efficient travel.",
      valueOptimization:
        "Selected experiences include audio guides and reserved access features. Combined tickets for Sainte-Chapelle and Conciergerie provide better value than separate entries.",
      experienceVariety:
        "Balanced mix of world-famous museums (Louvre, Orsay), iconic landmarks (Eiffel Tower), religious architecture (Sainte-Chapelle), and performing arts venue (Opera Garnier) for comprehensive Paris experience.",
    },
  },
};

export const anthropicService = {
  async sendMessage(
    messages: AnthropicMessage[],
    options?: Partial<AnthropicRequest>,
    bypassTimeout?: boolean
  ): Promise<AnthropicResponse> {
    try {
      const requestBody = {
        model: options?.model || "claude-sonnet-4-20250514",
        messages,
        max_tokens: options?.max_tokens || 10000,
        ...(options?.mcp_servers && { mcp_servers: options.mcp_servers }),
      };

      // Create AbortController for timeout handling
      const abortController = new AbortController();
      let timeoutId: number | null = null;

      // Only set timeout if not bypassing
      if (!bypassTimeout) {
        timeoutId = setTimeout(() => {
          abortController.abort();
        }, API_TIMEOUT);
      }

      const response = await fetch(`${API_BASE_URL}/api/anthropic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      // Clear timeout if request completed successfully
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API Error: ${errorData.error || "Unknown error occurred"}`
        );
      }

      const result: AnthropicResponse = await response.json();

      // Log the stop reason for debugging
      console.log(`API Response - Stop Reason: ${result.stop_reason}`);

      // Handle different stop reasons
      switch (result.stop_reason) {
        case "end_turn":
          // Normal completion
          break;
        case "max_tokens":
          console.warn("Response was truncated due to max_tokens limit");
          break;
        case "pause_turn":
          console.log("Response paused - will be handled by retry logic");
          break;
        case "tool_use":
          console.log("Tool use detected in response");
          break;
        case "refusal":
          console.warn("Claude refused to generate response");
          break;
        default:
          console.log(`Unknown stop reason: ${result.stop_reason}`);
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Anthropic API call timed out after 5 seconds");
        throw new Error(`API call timed out after ${API_TIMEOUT}ms`);
      }
      console.error("Anthropic API call failed:", error);
      throw error;
    }
  },

  async generateItinerary(
    attractions: string[],
    duration: number,
    travelerCounts: {
      adults: number;
      children: number;
      infants: number;
      seniors: number;
    },
    startDate: string,
    endDate: string,
    bypassTimeout?: boolean
  ): Promise<{
    success: boolean;
    itinerary: any;
    rawResponse: string;
    error?: string;
  }> {
    // Build traveler description dynamically, only including types with count > 0
    const travelerDescriptions = [];
    if (travelerCounts.adults > 0) {
      travelerDescriptions.push(
        `${travelerCounts.adults} adult${travelerCounts.adults > 1 ? "s" : ""}`
      );
    }
    if (travelerCounts.children > 0) {
      travelerDescriptions.push(
        `${travelerCounts.children} child${
          travelerCounts.children > 1 ? "ren" : ""
        }`
      );
    }
    if (travelerCounts.infants > 0) {
      travelerDescriptions.push(
        `${travelerCounts.infants} infant${
          travelerCounts.infants > 1 ? "s" : ""
        }`
      );
    }
    if (travelerCounts.seniors > 0) {
      travelerDescriptions.push(
        `${travelerCounts.seniors} senior${
          travelerCounts.seniors > 1 ? "s" : ""
        }`
      );
    }

    const travelerDescription = travelerDescriptions
      .join(", ")
      .replace(/,([^,]*)$/, " and$1");

    const prompt = `
You are an expert travel itinerary optimizer specializing in Headout experiences. 
When users share their travel plans, you will create data-driven, personalized 
itinerary optimizations using AI-powered optimization tools and comprehensive real-time analysis.

## Core Optimization Process

### 1. Initial Analysis
- Extract destination, travel dates, and group composition from user's itinerary
- Identify mentioned POIs, interests, and activity preferences from their original plan

### 2. Optimization Potential Assessment
- Use 'analyze_itinerary_potential' to quickly assess the destination's optimization opportunities
- Evaluate available experiences, POIs, and seasonal considerations
- Determine if the destination has sufficient content for meaningful optimization

### 3. AI-Powered Itinerary Optimization
- Use 'optimize_itinerary' with comprehensive parameters including:
  - Travel plan: destination, dates, estimated days, mentioned POIs
  - Group composition: adults, children with ages, seniors
  - Preferences: interests, activity types, budget, pace, special requirements
- Leverage AI analysis of POIs, experiences, seasonal patterns, logistics, and crowd data
- Generate bookable variants with optimal time slots and pricing

### 4. Results Analysis & Refinement
- Analyze the optimized itinerary recommendations
- Validate experience availability and pricing for specified dates
- Cross-reference with user's original preferences and constraints
- Identify any gaps or additional opportunities

## Key Optimization Factors

The AI optimization considers:
- Real-time pricing and availability data
- Seasonal crowd patterns and operational data
- Group eligibility and age restrictions
- Geographic clustering for efficient routing
- Experience duration and schedule optimization
- Value-for-money analysis across variants
- POI visiting patterns and logistics
- Weather and seasonal considerations

## Personalization Elements
- Travel group composition and age-appropriate activities
- Budget constraints and spending optimization
- Activity preferences inferred from original itinerary
- Time constraints and pace preferences (relaxed/moderate/intensive)
- Special requirements (accessibility, dietary, language)

## Success Metrics
- All recommended experiences are bookable for specified dates
- Total itinerary cost aligns with user budget
- Logical sequencing minimizes travel time
- High-quality experiences based on review analysis
- Comprehensive backup options for flexibility
- Clear booking instructions with specific time slots

## Communication Style
- Professional yet friendly and enthusiastic
- Data-driven recommendations with clear reasoning
- Practical and actionable advice
- Comprehensive but well-organized information
- Clear prioritization and urgency indicators
- Confident expertise while acknowledging limitations

## Response Structure
Always structure responses with:
1. Executive Summary - Key recommendations overview
2. Detailed Analysis - Experience-by-experience breakdown
3. Budget & Logistics - Pricing and scheduling details
4. Booking Strategy - Priority order and timing
5. Alternatives & Contingencies - Backup options
6. Next Steps - Clear action items for the user

## Output format
You MUST return a JSON response with the EXACT structure below. Do not include any text before or after the JSON.

REQUIRED JSON STRUCTURE:
{
  "itinerary": {
    "day1": {
      "morning": {
        "timeSlot": "HH:MM-HH:MM",
        "experienceId": number,
        "vendorId": "headout", 
        "tourId": number,
        "variantId": number,
        "tourGroupName": "string",
        "variantName": "string",
        "duration": "Xh Ym",
        "location": "string", 
        "notes": "string"
      },
      "afternoon": { same 10 fields as morning },
      "evening": { same 10 fields as morning }
    },
    "day2": { same structure as day1 },
    "optimizationNotes": {
      "crowdAvoidance": "string",
      "logistics": "string",
      "valueOptimization": "string", 
      "experienceVariety": "string"
    }
  }
}

CRITICAL REQUIREMENTS:
- Each day must have exactly 3 time slots: morning, afternoon, evening
- Each time slot must include ALL 10 fields: timeSlot, experienceId, vendorId, tourId, variantId, tourGroupName, variantName, duration, location, notes
- experienceId, tourId, variantId must be actual numbers from MCP data
- optimizationNotes must include all 4 fields: crowdAvoidance, logistics, valueOptimization, experienceVariety
- Do not use price tools
- Return ONLY the JSON, no additional text
- Do not include any experience that is not mentioned by the user
- You can keep slots empty if you think it is not necessary, you don't have to fill all slots in every day.

Now generate a ${duration} day optimised itinerary for ${travelerDescription}, 
traveling from ${startDate} to ${endDate}. They are visiting ${attractions.join(
      ", "
    )}.`;

    try {
      const response = await this.handlePauseTurnConversation(
        [{ role: "user", content: prompt }],
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 10000,
          mcp_servers: [
            {
              type: "url",
              url: "https://proud-sparkle-production.up.railway.app/mcp",
              name: "headout",
            },
          ],
        },
        5,
        bypassTimeout
      );

      // Extract and sanitize JSON from the response
      const extractedItinerary = this.extractItineraryJSON(response);
      return extractedItinerary;
    } catch (error) {
      console.error("Itinerary generation failed:", error);

      // Check if it's a timeout error or API failure
      const isTimeout =
        error instanceof Error && error.message.includes("timed out");
      const isApiFailure =
        error instanceof Error &&
        (error.message.includes("API Error") ||
          error.message.includes("fetch") ||
          error.message.includes("network"));

      if (isTimeout || isApiFailure) {
        console.log(
          "Using backup itinerary response due to API timeout or failure"
        );

        // Return the backup itinerary with success flag
        return {
          success: true,
          itinerary: BACKUP_ITINERARY,
          rawResponse: "Backup response used due to API timeout or failure",
        };
      }

      // For other errors, return the original error response
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        itinerary: null,
        rawResponse: "API call failed or timed out",
      };
    }
  },

  async handlePauseTurnConversation(
    messages: AnthropicMessage[],
    options?: Partial<AnthropicRequest>,
    maxRetries: number = 5,
    bypassTimeout?: boolean
  ): Promise<AnthropicResponse> {
    let currentMessages = [...messages];
    let response: AnthropicResponse;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`Making API call (attempt ${attempt + 1}/${maxRetries})`);
      response = await this.sendMessage(
        currentMessages,
        options,
        bypassTimeout
      );

      // If the response doesn't have pause_turn, we're done
      if (response.stop_reason !== "pause_turn") {
        console.log(
          `Conversation completed with stop_reason: ${response.stop_reason}`
        );
        return response;
      }

      console.log(`Handling pause_turn (attempt ${attempt + 1}/${maxRetries})`);
      console.log(`Response content items: ${response.content.length}`);

      // Continue the conversation by adding the assistant's response
      // According to Anthropic docs, we should preserve the exact content structure
      currentMessages.push({
        role: "assistant",
        content: this.formatResponseContent(response.content),
      });

      console.log(new Date().getTime());

      // Add a small delay to prevent overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 60000));
      console.log(new Date().getTime());
    }

    // If we've exhausted retries, return the last response we got
    // This allows the caller to handle it appropriately
    console.warn(
      `Maximum retries (${maxRetries}) exceeded for pause_turn handling`
    );
    return response!;
  },

  formatResponseContent(
    content: Array<{ type: string; text?: string; [key: string]: any }>
  ): string {
    return content
      .map((item) => {
        if (item.type === "text" && item.text) {
          return item.text;
        } else if (item.type === "mcp_tool_use") {
          // Handle MCP tool use - preserve the structure for continuation
          return `[Tool: ${item.name}]`;
        } else if (item.type === "mcp_tool_result") {
          // Handle MCP tool results
          return `[Tool Result: ${item.tool_use_id}]`;
        } else {
          // Handle any other content types
          return `[${item.type}]`;
        }
      })
      .join(" ");
  },

  extractItineraryJSON(response: AnthropicResponse): any {
    try {
      // Find the text content that contains JSON
      let jsonText = "";

      // Look through all content items to find JSON
      for (const content of response.content) {
        if (content.type === "text" && content.text) {
          // Check if this content contains JSON-like structure
          if (content.text.includes("{") && content.text.includes("}")) {
            jsonText = content.text;
            break;
          }
        }
      }

      if (!jsonText) {
        throw new Error("No JSON content found in response");
      }

      // Handle different JSON format cases
      let cleanedJson = jsonText;

      // Case 1: Remove ```json wrapper if present
      if (cleanedJson.includes("```json")) {
        cleanedJson = cleanedJson.replace(/```json\s*/g, "");
        cleanedJson = cleanedJson.replace(/```\s*$/g, "");
      }

      // Case 2: Remove ``` wrapper without json keyword
      if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```\s*/, "");
        cleanedJson = cleanedJson.replace(/```\s*$/, "");
      }

      // Case 3: Extract JSON from mixed text content
      // Look for the first { and last } to extract JSON block
      const firstBrace = cleanedJson.indexOf("{");
      const lastBrace = cleanedJson.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
      }

      // Additional cleanup for all whitespace and escape characters
      cleanedJson = cleanedJson.trim();

      // Handle various whitespace and escape characters
      // Note: \n, \r, \t are valid JSON escape sequences and will be handled by JSON.parse()
      // But we can clean up any extraneous whitespace around the JSON structure
      cleanedJson = cleanedJson.replace(/^\s+|\s+$/g, ""); // Remove leading/trailing whitespace

      // Validate and parse JSON
      const parsedItinerary = JSON.parse(cleanedJson);

      // Return the parsed itinerary data
      return {
        success: true,
        itinerary: parsedItinerary,
        rawResponse: jsonText,
      };
    } catch (error) {
      console.error("Failed to extract JSON from response:", error);

      // Fallback: return structured error with raw response for debugging
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        itinerary: null,
        rawResponse: response.content[0]?.text || "No response text available",
      };
    }
  },
};
