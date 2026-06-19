import OpenAI from "openai";
import { logger } from "./logger";

if (!process.env.OPENAI_API_KEY) {
  logger.error("OPENAI_API_KEY is not set");
  throw new Error("OPENAI_API_KEY environment variable is required");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
