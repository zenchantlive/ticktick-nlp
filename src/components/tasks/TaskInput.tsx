"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function TaskInput() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: async (text: string) => {
      // First, process through NLP
      const nlpResponse = await fetch("/api/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });

      if (!nlpResponse.ok) {
        throw new Error("Failed to process natural language input");
      }

      const { task } = await nlpResponse.json();

      // Then, create the task
      const createResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create task");
      }

      return createResponse.json();
    },
    onSuccess: () => {
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await createTask.mutateAsync(input);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task using natural language..."
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-md text-white text-sm font-medium transition-colors ${
            !input.trim() || isProcessing
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isProcessing ? (
            <div className="h-5 w-5 border-t-2 border-white rounded-full animate-spin" />
          ) : (
            "Add"
          )}
        </button>
      </div>
      {createTask.error && (
        <p className="mt-2 text-sm text-red-600">
          {createTask.error instanceof Error
            ? createTask.error.message
            : "An error occurred"}
        </p>
      )}
    </form>
  );
}
