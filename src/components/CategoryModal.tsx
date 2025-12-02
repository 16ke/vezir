// src/components/CategoryModal.tsx
"use client";

import { useState } from "react";
import { Category } from "@/types/task";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: Category) => void;
  existingCategories: Category[];
}

export default function CategoryModal({ 
  isOpen, 
  onClose, 
  onCategoryCreated,
  existingCategories 
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          color: color,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // FIX: Handle both formats - { category: ... } or direct category
        const newCategory = data.category || data;
        onCategoryCreated(newCategory);
        setName("");
        setColor("#3b82f6");
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      setError("Failed to create category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setColor("#3b82f6");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full border-theme">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-foreground">Create New Category</h2>
            <button
              onClick={handleClose}
              className="text-muted hover:text-foreground transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="modalCategoryName" className="block text-sm font-medium text-foreground mb-2">
                Category Name *
              </label>
              <input
                type="text"
                id="modalCategoryName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work, Personal, Urgent"
                className="w-full px-3 py-2 border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] bg-card text-foreground"
                required
              />
            </div>

            <div>
              <label htmlFor="modalCategoryColor" className="block text-sm font-medium text-foreground mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  id="modalCategoryColor"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 border-theme rounded cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-sm text-muted block">{color}</span>
                  <div 
                    className="w-full h-4 rounded mt-1 border"
                    style={{ backgroundColor: color }}
                  ></div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="flex-1 bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white py-2 px-4 rounded-md hover:from-[var(--turquoise-700)] hover:to-purple-700 disabled:opacity-50 transition-colors font-medium"
              >
                {isLoading ? "Creating..." : "Create Category"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>

          {existingCategories.length > 0 && (
            <div className="mt-6 pt-4 border-t border-theme">
              <h3 className="text-sm font-medium text-foreground mb-3">Existing Categories</h3>
              <div className="flex flex-wrap gap-2">
                {existingCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm border"
                    style={{ borderColor: category.color, color: category.color }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}