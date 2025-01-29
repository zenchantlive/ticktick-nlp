import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";

const NLPRequestSchema = z.object({
  input: z.string().min(1),
});

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function processNaturalLanguage(input: string) {
  const response = await fetch(OPENROUTER_API_URL, {
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
          Respond with a JSON object containing these fields.`
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
  return data.choices[0].message.content;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = NLPRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error },
        { status: 400 }
      );
    }

    const taskData = await processNaturalLanguage(validated.data.input);
    return NextResponse.json({ task: taskData });
  } catch (error) {
    console.error("Error processing natural language:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
