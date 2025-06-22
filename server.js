import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== "production";

// Enable CORS - more permissive in development, restricted in production
if (isDevelopment) {
  app.use(
    cors({
      origin: "http://localhost:5173", // Vite default port
      credentials: true,
    })
  );
} else {
  app.use(cors());
}

app.use(express.json());

// Serve static files in production
if (!isDevelopment) {
  app.use(express.static(path.join(__dirname, "dist")));
}

// Anthropic API endpoint with MCP support
app.post("/api/anthropic", async (req, res) => {
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
});

// Catch-all handler for React Router (SPA routing)
if (!isDevelopment) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📡 Anthropic proxy available at http://localhost:${PORT}/api/anthropic`
  );
  if (isDevelopment) {
    console.log(`🎨 Frontend dev server: http://localhost:5173`);
  } else {
    console.log(`🎨 Frontend served from: http://localhost:${PORT}`);
  }
});
