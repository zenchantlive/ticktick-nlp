"use client";

import { useQuery } from "@tanstack/react-query";

interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority?: number;
  tags?: string[];
}

export default function TaskList() {
  const { data: tasks, isLoading, error } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error loading tasks. Please try again.
      </div>
    );
  }

  if (!tasks?.length) {
    return (
      <div className="p-4 text-center text-gray-500">
        No tasks yet. Create one using natural language!
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {task.title}
              </p>
              {task.dueDate && (
                <p className="mt-1 text-xs text-gray-500">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
              {task.tags && task.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {task.priority !== undefined && (
              <div className="ml-3 flex-shrink-0">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  task.priority === 0
                    ? "bg-gray-400"
                    : task.priority === 1
                    ? "bg-blue-400"
                    : task.priority === 2
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
