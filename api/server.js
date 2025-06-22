import fetch from "node-fetch";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { url } = req;

  // Health check endpoint
  if (url === "/api/health") {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      platform: "vercel",
    });
    return;
  }

  // Anthropic API endpoint
  if (url === "/api/anthropic" && req.method === "POST") {
    try {
      const {
        messages,
        model = "claude-sonnet-4-20250514",
        max_tokens = 10000,
        mcp_servers,
      } = req.body;

      // Build the request body
      const requestBody = {
        model,
        max_tokens,
        messages,
        ...(mcp_servers && { mcp_servers }),
      };

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "mcp-client-2025-04-04",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Anthropic API Error:", errorData);
        return res.status(response.status).json({
          error: "Anthropic API request failed",
          details: errorData,
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  // Handle 404 for unknown API routes
  res.status(404).json({ error: "API endpoint not found" });
}
