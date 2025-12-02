"use client"
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Task, Category } from "@/types/task";
import NotificationDashboard from "@/components/NotificationDashboard";
import { getDueDateStatus, getDueDateBadgeColor, getDueDateIcon, getDueDateText } from "@/lib/dateUtils";
import ExportButton from "@/components/ExportButton";

// Type definitions for component props
interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onToggleSelection: (taskId: string) => void;
  onMarkAsDone: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

interface ExportFilters {
  status: string;
  priority: string;
  categoryId: string;
}

interface PriorityValueMap {
  [key: string]: number;
}

// Memoized task card component to prevent unnecessary re-renders
const TaskCard = React.memo(({ 
  task, 
  isSelected, 
  onToggleSelection, 
  onMarkAsDone, 
  onEdit, 
  onDelete 
}: TaskCardProps) => {
  const dueDateStatus = getDueDateStatus(task.dueDate, task.status);
  
  return (
    <div 
      className={`bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-gold-lg hover:border-gold-lg ${
        isSelected ? 'ring-2 ring-[var(--turquoise-500)] ring-opacity-50' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 flex items-start space-x-4">
          <label className="flex items-start mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(task.id)}
              className="w-4 h-4 text-[var(--turquoise-500)] bg-card border-gold rounded focus:ring-[var(--turquoise-500)] focus:ring-2 mt-1"
            />
          </label>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-xl text-foreground pr-4 font-elegant">{task.title}</h3>
              {task.priority && (
                <span className={`ml-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-gold ${
                  task.priority === 'URGENT' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                  task.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                  task.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                  'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                }`}>
                  {task.priority}
                </span>
              )}
            </div>
            
            {task.description && (
              <p className="text-muted mb-4 text-sm leading-relaxed font-body">{task.description}</p>
            )}
            
            {task.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {task.categories.map((category) => (
                  <span 
                    key={category.id}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gold flex items-center space-x-1 font-body"
                    style={{ 
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                      borderColor: `${category.color}40`
                    }}
                  >
                    <span>🏷️</span>
                    <span>{category.name}</span>
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center flex-wrap gap-3">
              <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border border-gold ${
                task.status === 'DONE' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                task.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              } font-body`}>
                {task.status.replace('_', ' ')}
              </span>
              
              {task.dueDate && (
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border border-gold flex items-center space-x-1 ${getDueDateBadgeColor(dueDateStatus.status)} font-body`}>
                  <span>{getDueDateIcon(dueDateStatus.status)}</span>
                  <span>{getDueDateText(task.dueDate, dueDateStatus.status, dueDateStatus.daysUntilDue)}</span>
                </span>
              )}
              
              <span className="text-xs text-muted font-body">
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-6">
          {task.status !== 'DONE' && (
            <button
              onClick={() => onMarkAsDone(task.id)}
              className="bg-gray-100 text-gray-500 p-2 rounded-full text-sm hover:bg-green-100 hover:text-green-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-green-900/30 dark:hover:text-green-300 transition-all duration-200 hover:scale-110 flex items-center justify-center border border-gold"
              title="Mark as done"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(task.id)}
            className="bg-blue-100 text-blue-600 p-2 rounded-full text-sm hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-110 border border-gold"
            title="Edit task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="bg-red-100 text-red-600 p-2 rounded-full text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-all duration-200 hover:scale-110 border border-gold"
            title="Delete task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="min-h-screen p-4">
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent font-elegant">
            My Tasks
          </h1>
        </div>
        <div className="bg-gray-300 text-gray-500 px-6 py-3 rounded-full animate-pulse">
          + New Task
        </div>
      </div>
      
      <div className="grid gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-card p-6 rounded-xl shadow-lg animate-pulse border-gold-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="h-7 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="flex items-center mt-4 space-x-3">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="flex space-x-3 ml-6">
                <div className="h-9 bg-gray-200 rounded-full w-9"></div>
                <div className="h-9 bg-gray-200 rounded-full w-9"></div>
                <div className="h-9 bg-gray-200 rounded-full w-9"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [sortByPriority, setSortByPriority] = useState<boolean>(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Memoized priority value calculation with proper typing
  const getPriorityValue = useCallback((priority: string): number => {
    const priorityMap: PriorityValueMap = {
      'URGENT': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1
    };
    return priorityMap[priority] || 0;
  }, []);

  // Optimized filtering and sorting with useMemo
  const filteredAndSortedTasks = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    const filtered = tasks.filter((task: Task) => {
      const matchesSearch = searchTerm === "" || 
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower));
      
      let matchesStatus = true;
      if (statusFilter === "ACTIVE") {
        matchesStatus = task.status === "TODO" || task.status === "IN_PROGRESS";
      } else if (statusFilter !== "") {
        matchesStatus = task.status === statusFilter;
      }

      const matchesCategory = categoryFilter === "" || 
        task.categories.some((cat: Category) => cat.id === categoryFilter);
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    return filtered.sort((a: Task, b: Task) => {
      if (sortByPriority) {
        const priorityA = getPriorityValue(a.priority || '');
        const priorityB = getPriorityValue(b.priority || '');
        
        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }
      }

      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "dueDate":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [tasks, searchTerm, statusFilter, categoryFilter, sortBy, sortByPriority, getPriorityValue]);

  // Memoized data fetching
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const [tasksResponse, categoriesResponse] = await Promise.all([
          fetch("/api/tasks", { 
            cache: 'force-cache' as RequestCache,
            next: { tags: ['tasks'] }
          }),
          fetch("/api/categories", { 
            cache: 'force-cache' as RequestCache,
            next: { tags: ['categories'] }
          })
        ]);

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData.tasks || []);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Memoized event handlers with proper typing
  const toggleTaskSelection = useCallback((taskId: string): void => {
    setSelectedTasks((prev: Set<string>) => {
      const newSelected = new Set(prev);
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId);
      } else {
        newSelected.add(taskId);
      }
      return newSelected;
    });
  }, []);

  const selectAllTasks = useCallback((): void => {
    setSelectedTasks((prev: Set<string>) => {
      if (prev.size === filteredAndSortedTasks.length) {
        return new Set();
      } else {
        return new Set(filteredAndSortedTasks.map((task: Task) => task.id));
      }
    });
  }, [filteredAndSortedTasks]);

  const clearSelection = useCallback((): void => {
    setSelectedTasks(new Set());
  }, []);

  const handleMarkAsDone = useCallback(async (taskId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "DONE",
        }),
      });

      if (response.ok) {
        setTasks((prev: Task[]) => prev.map(task => 
          task.id === taskId ? { ...task, status: "DONE" } : task
        ));
        setSelectedTasks((prev: Set<string>) => {
          const newSelected = new Set(prev);
          newSelected.delete(taskId);
          return newSelected;
        });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to mark as done"}`);
      }
    } catch (error) {
      console.error("Error marking task as done:", error);
      alert("Failed to mark task as done.");
    }
  }, []);

  const handleEdit = useCallback((taskId: string): void => {
    router.push(`/tasks/edit/${taskId}`);
  }, [router]);

  const handleDelete = useCallback(async (taskId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    // Store the task being deleted for possible restoration
    const taskToDelete = tasks.find(t => t.id === taskId);
    
    // Optimistic update: remove from UI immediately
    setTasks((prev: Task[]) => prev.filter(task => task.id !== taskId));
    setSelectedTasks((prev: Set<string>) => {
      const newSelected = new Set(prev);
      newSelected.delete(taskId);
      return newSelected;
    });

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to delete task"}`);
        
        // Restore task on error
        if (taskToDelete) {
          setTasks((prev: Task[]) => [...prev, taskToDelete]);
        }
      }
      // No need to do anything on success since we already updated optimistically
      
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
      
      // Restore task on error
      if (taskToDelete) {
        setTasks((prev: Task[]) => [...prev, taskToDelete]);
      }
    }
  }, [tasks]);

  const currentFilters: ExportFilters = useMemo(() => ({
    status: statusFilter,
    priority: '',
    categoryId: categoryFilter
  }), [statusFilter, categoryFilter]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent font-elegant">
              My Tasks
            </h1>
            <p className="text-white mt-2 font-body">Manage your tasks efficiently</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-gradient-to-r from-[var(--turquoise-500)] to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-gold font-body">
              {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}
            </span>
            <ExportButton 
              currentFilters={currentFilters} 
              selectedTaskIds={Array.from(selectedTasks)}
              totalTasksCount={filteredAndSortedTasks.length}
            />
            <Link 
              href="/tasks/new"
              className="bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white px-6 py-3 rounded-full hover:from-[var(--turquoise-700)] hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium border border-gold font-body"
            >
              ✍️ New Task
            </Link>
          </div>
        </div>

        {/* Selection Controls */}
        {selectedTasks.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 border-gold">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-blue-700 dark:text-blue-300 font-medium font-body">
                  {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm underline font-body"
                >
                  Clear selection
                </button>
              </div>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-body">
                Export selected tasks or use filters above for bulk export
              </div>
            </div>
          </div>
        )}

        {/* Notification Dashboard */}
        <NotificationDashboard tasks={tasks} />

        {/* Search and Filter Section */}
        <div className="bg-card p-6 rounded-xl shadow-lg mb-8 border-gold-lg">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2 font-body">
                🔍 Search Tasks
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-all duration-200 bg-card text-foreground border-gold font-body"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2 font-body">
                  📊 Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-all duration-200 text-sm bg-card text-foreground border-gold font-body"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-foreground mb-2 font-body">
                  🔄 Sort
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-all duration-200 text-sm bg-card text-foreground border-gold font-body"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="dueDate">Due Date</option>
                  <option value="title">A-Z</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2 font-body">
                🏷️ Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--turquoise-500)] focus:border-transparent transition-all duration-200 text-sm bg-card text-foreground border-gold font-body"
              >
                <option value="">All Categories</option>
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Sort Toggle */}
            <div className="flex items-end">
              <label className="flex items-center space-x-3 p-3 bg-card rounded-xl hover:bg-surface cursor-pointer transition-all duration-200 border-gold font-body">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={sortByPriority}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSortByPriority(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-all duration-300 ${
                    sortByPriority ? 'bg-[var(--turquoise-500)]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                      sortByPriority ? 'transform translate-x-5' : 'transform translate-x-1'
                    }`}></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">⚡ Priority Sort</span>
                  <span className="text-xs text-muted">
                    {sortByPriority ? 'URGENT → HIGH → MEDIUM → LOW' : 'Click to enable'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Select All Controls - Transparent divider line */}
          {filteredAndSortedTasks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-transparent">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTasks.size > 0 && selectedTasks.size === filteredAndSortedTasks.length}
                    onChange={selectAllTasks}
                    className="w-4 h-4 text-[var(--turquoise-500)] bg-card border-gold rounded focus:ring-[var(--turquoise-500)] focus:ring-2"
                  />
                  <span className="text-sm font-medium text-foreground font-body">
                    {selectedTasks.size === filteredAndSortedTasks.length ? 'Deselect all' : 'Select all'} visible tasks
                  </span>
                </label>
                {selectedTasks.size > 0 && (
                  <span className="text-sm text-muted font-body">
                    ({selectedTasks.size} of {filteredAndSortedTasks.length} selected)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tasks List */}
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl shadow-lg border-gold-lg">
            <div className="text-8xl mb-6">📜</div>
            <h3 className="text-2xl font-bold text-foreground mb-4 font-elegant">
              {tasks.length === 0 ? "No tasks yet!" : "No tasks found"}
            </h3>
            <p className="text-muted text-lg mb-8 max-w-md mx-auto font-body">
              {tasks.length === 0 
                ? "Get started by creating your first task to stay organized and productive!" 
                : "Try adjusting your search or filters to find what you're looking for."}
            </p>
            {tasks.length === 0 ? (
              <Link 
                href="/tasks/new"
                className="bg-gradient-to-r from-[var(--turquoise-600)] to-purple-600 text-white px-8 py-3 rounded-full hover:from-[var(--turquoise-700)] hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium inline-block border border-gold font-body"
              >
                Create Your First Task
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setCategoryFilter("");
                  setSortByPriority(false);
                  clearSelection();
                }}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-full hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium border border-gold font-body"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAndSortedTasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTasks.has(task.id)}
                onToggleSelection={toggleTaskSelection}
                onMarkAsDone={handleMarkAsDone}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}