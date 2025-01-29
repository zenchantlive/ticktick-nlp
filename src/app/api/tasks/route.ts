import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Task validation schema
const TaskSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().optional(),
  priority: z.number().min(0).max(3).optional(),
  tags: z.array(z.string()).optional(),
});

// API response cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Exponential backoff retry
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

async function fetchTickTick(
  path: string,
  options: RequestInit,
  session: any
): Promise<Response> {
  const url = `${process.env.TICKTICK_API_URL}${path}`;
  return fetchWithRetry(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check cache
    const cacheKey = `tasks-${session.accessToken}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const response = await fetchTickTick("/task", {
      method: "GET",
    }, session);

    if (!response.ok) {
      throw new Error(`TickTick API error: ${response.statusText}`);
    }

    const tasks = await response.json();

    // Update cache
    cache.set(cacheKey, {
      data: { tasks },
      timestamp: Date.now(),
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedTask = TaskSchema.safeParse(body);

    if (!validatedTask.success) {
      return NextResponse.json(
        { error: "Invalid task data", details: validatedTask.error },
        { status: 400 }
      );
    }

    const response = await fetchTickTick("/task", {
      method: "POST",
      body: JSON.stringify({
        ...validatedTask.data,
        status: 0, // 0 = not completed
      }),
    }, session);

    if (!response.ok) {
      throw new Error(`TickTick API error: ${response.statusText}`);
    }

    const task = await response.json();

    // Invalidate cache
    const cacheKey = `tasks-${session.accessToken}`;
    cache.delete(cacheKey);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
