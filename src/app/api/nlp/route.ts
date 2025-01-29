import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const NLPRequestSchema = z.object({
  input: z.string().min(1),
});

const TaskSchema = z.object({
  title: z.string(),
  dueDate: z.string().optional(),
  priority: z.number().min(0).max(3).optional(),
  tags: z.array(z.string()).optional(),
});

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Cache for NLP responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || attempt === maxRetries) {
        return response;
      }
      const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
  throw new Error("Max retries reached");
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRateLimit = rateLimits.get(userId) || { count: 0, resetTime: now + RATE_WINDOW };

  if (now > userRateLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userRateLimit.count >= RATE_LIMIT) {
    return false;
  }

  userRateLimit.count++;
  rateLimits.set(userId, userRateLimit);
  return true;
}

async function processNaturalLanguage(input: string) {
  const response = await fetchWithRetry(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.VERCEL_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-sonnet:beta",
      messages: [
        {
          role: "system",
          content: `You are a task parser that converts natural language inputs into structured task data. 
          Extract task details like title, due date, priority (0-3), and tags from the input.
          Format your response as a valid JSON object with these fields:
          {
            "title": "string (required)",
            "dueDate": "ISO string (optional)",
            "priority": number 0-3 (optional),
            "tags": string[] (optional)
          }
          Example: "high priority report due tomorrow" ->
          {
            "title": "report",
            "dueDate": "2024-01-30T23:59:59Z",
            "priority": 3,
            "tags": []
          }`
        },
        {
          role: "user",
          content: input
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse and validate the LLM response
  try {
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
    const validatedTask = TaskSchema.parse(parsedContent);
    return validatedTask;
  } catch (error) {
    console.error("Invalid LLM response:", content);
    throw new Error("Failed to parse LLM response");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    if (!checkRateLimit(session.user?.email || 'anonymous')) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = NLPRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error },
        { status: 400 }
      );
    }

    // Check cache
    const input = validated.data.input.trim().toLowerCase();
    const cacheKey = `nlp-${input}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ task: cached.data });
    }

    const taskData = await processNaturalLanguage(input);

    // Update cache
    cache.set(cacheKey, {
      data: taskData,
      timestamp: Date.now(),
    });

    return NextResponse.json({ task: taskData });
  } catch (error) {
    console.error("Error processing natural language:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid task format", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
