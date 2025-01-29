import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";

// Task validation schema
const TaskSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().optional(),
  priority: z.number().min(0).max(3).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Implement TickTick API integration
    return NextResponse.json({ tasks: [] });
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

    // TODO: Implement TickTick API integration
    return NextResponse.json({ message: "Task created" }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
