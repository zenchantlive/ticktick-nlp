import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TaskList from "@/components/tasks/TaskList";
import TaskInput from "@/components/tasks/TaskInput";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
      </header>

      <div className="flex-1 overflow-auto">
        <TaskList />
      </div>

      <div className="sticky bottom-0">
        <TaskInput />
      </div>
    </div>
  );
}
