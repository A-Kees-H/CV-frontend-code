import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { queryRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/query", async (req, res) => {
    try {
      const validatedData = queryRequestSchema.parse(req.body);
      
      const response = await fetch("https://llm-cv-api.onrender.com/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        let errorMessage = `API Error (${response.status})`;
        
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (e) {
          errorMessage = response.statusText;
        }

        if (response.status === 404) {
          errorMessage = "The CV query endpoint is not available. The backend service may not be deployed or the /query endpoint might not exist. Please verify your FastAPI backend is running at https://llm-cv-api.onrender.com/query";
        }

        return res.status(200).json({
          error: errorMessage,
        });
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      return res.status(200).json({
        error: error.message || "Failed to connect to the CV query service",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
