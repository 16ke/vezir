'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          color: newCategoryColor,
        }),
      });

      if (response.ok) {
        setNewCategoryName("");
        setNewCategoryColor("#3b82f6");
        fetchCategories(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to create category"}`);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This will remove it from all associated tasks.")) {
      return;
    }

    // Optimistic update: remove from UI immediately
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setDeletingId(categoryId);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to delete category"}`);
        
        // Re-fetch if error to restore the category
        fetchCategories();
      }
      // No need to do anything on success since we already updated optimistically
      
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
      
      // Re-fetch on error
      fetchCategories();
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-gray-200 rounded border-gold-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/tasks" className="text-[var(--turquoise-600)] hover:underline font-body">
              &larr; Back to Tasks
            </Link>
            <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent font-elegant">Manage Categories</h1>
            <p className="text-white mt-1 font-body">Organize your tasks with custom categories</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg mb-8 border-gold-lg">
          <h2 className="text-xl font-semibold mb-4 text-foreground font-elegant">Create New Category</h2>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="categoryName" className="block text-sm font-medium text-foreground mb-2 font-body">
                  Category Name
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Work, Personal, Urgent"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] bg-card text-foreground border-gold-lg font-body"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="categoryColor" className="block text-sm font-medium text-foreground mb-2 font-body">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="categoryColor"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border-gold-lg"
                  />
                  <span className="text-sm text-muted font-body">{newCategoryColor}</span>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isCreating || !newCategoryName.trim()}
              className="bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white px-6 py-2 rounded-md hover:from-[var(--turquoise-700)] hover:to-purple-700 disabled:opacity-50 transition-colors border border-gold-lg font-body"
            >
              {isCreating ? "Creating..." : "Create Category"}
            </button>
          </form>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg border-gold-lg">
          <h2 className="text-xl font-semibold mb-4 text-foreground font-elegant">
            Your Categories ({categories.length})
          </h2>
          
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏷️</div>
              <p className="text-muted text-lg font-body">No categories yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-4 rounded-lg hover:bg-surface transition-colors border-gold-lg ${
                    deletingId === category.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full border border-gold-lg"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div>
                      <span className="font-medium text-foreground block font-body">{category.name}</span>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-muted font-body" style={{ color: category.color }}>
                          {category.color}
                        </span>
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-foreground border border-gold-lg font-body">
                          {category.taskCount} task{category.taskCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={deletingId === category.id}
                    className="p-2 transition-colors border border-gold-lg rounded text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    title="Delete category"
                  >
                    {deletingId === category.id ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border-gold-lg text-center">
            <div className="text-2xl font-bold text-[var(--turquoise-600)] font-elegant">
              {categories.length}
            </div>
            <div className="text-sm text-muted font-body">Total Categories</div>
          </div>
          <div className="bg-card p-4 rounded-lg border-gold-lg text-center">
            <div className="text-2xl font-bold text-purple-600 font-elegant">
              {categories.filter(cat => cat.taskCount > 0).length}
            </div>
            <div className="text-sm text-muted font-body">Categories in Use</div>
          </div>
          <div className="bg-card p-4 rounded-lg border-gold-lg text-center">
            <div className="text-2xl font-bold text-green-600 font-elegant">
              {categories.reduce((total, cat) => total + cat.taskCount, 0)}
            </div>
            <div className="text-sm text-muted font-body">Total Task Assignments</div>
          </div>
        </div>
      </div>
    </div>
  );
}