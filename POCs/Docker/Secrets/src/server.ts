import dotenv from "dotenv";
import express, { Request, Response } from "express";
import fs from "fs";

dotenv.config();

const app = express();

// Configuration interface
interface AppConfig {
  apikey: string;
  port: number;
  source: string;
}

// Type guard to validate AppConfig
const isAppConfig = (obj: unknown): obj is AppConfig => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).port === "number" &&
    typeof (obj as Record<string, unknown>).source === "string" &&
    typeof (obj as Record<string, unknown>).apikey === "string"
  );
};

// Function to load configuration
const loadConfig = (): AppConfig => {
  const configFile = process.env.CONFIG_FILE;
  console.info("Loading configuration from file:", configFile);
  if (configFile && fs.existsSync(configFile)) {
    try {
      const configData = fs.readFileSync(configFile, "utf8");
      const parsed: unknown = JSON.parse(configData);
      if (isAppConfig(parsed)) {
        return parsed;
      }
      console.warn(
        "Config file does not match AppConfig schema, using defaults",
      );
    } catch (error) {
      console.error("Error reading config file:", error);
    }
  }
  return {
    apikey: process.env.API_KEY ?? "baken-api-key",
    port: Number(process.env.PORT ?? "3000"),
    source: process.env.SOURCE ?? "baken-source",
  };
};

const config = loadConfig();
const port = config.port;

// Function to get API key from secret file or environment
const getApiKey = (): null | string => {
  // Try to read from Docker secret file first
  const secretFile = process.env.API_KEY_FILE;
  console.info("Attempting to read API key from secret file:", secretFile);
  if (secretFile && fs.existsSync(secretFile)) {
    try {
      return fs.readFileSync(secretFile, "utf8").trim();
    } catch (error) {
      console.error("Error reading API key from secret file:", error);
    }
  }

  // Fallback to environment variable
  return process.env.API_KEY ?? null;
};

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Express Server läuft!",
    status: "ok",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/apikey", (_req: Request, res: Response) => {
  res.json({
    apiKeyFromConfig: config.apikey,
    apiKeyFromSecrets: getApiKey(),
    source: config.source,
  });
});

app.use((_req: Request<object, unknown, unknown>, res: Response) => {
  res.status(404).json({
    error: "Route nicht gefunden",
  });
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${String(port)}`);
});
