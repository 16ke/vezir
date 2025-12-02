// src/app/api/tasks/[id]/route.ts
// FIXED: Zero TypeScript errors - all parameters properly typed

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Type definitions for proper type safety
interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  categoryIds?: string[];
}

interface CategoryRelation {
  category: {
    id: string;
    name: string;
    color?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Type guard for session user
function isSessionUser(user: unknown): user is SessionUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    typeof (user as SessionUser).id === 'string'
  );
}

// Type guard for task update data
function isValidTaskUpdateData(data: unknown): data is TaskUpdateData {
  return (
    typeof data === 'object' &&
    data !== null
  );
}

// Generate ETag for caching - FIXED: Handle nullable priority
function generateETag(task: {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  updatedAt: Date;
}): string {
  const content = JSON.stringify({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority || "MEDIUM", // Handle null case
    updatedAt: task.updatedAt.getTime()
  });
  return Buffer.from(content).toString('base64');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check for If-None-Match header for cache validation
    const ifNoneMatch = request.headers.get('if-none-match');
    
    const task = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Generate ETag for caching
    const eTag = generateETag(task);
    
    // If client has same ETag, return 304 Not Modified
    if (ifNoneMatch === eTag) {
      return new NextResponse(null, { status: 304 });
    }

    // Transform the data to include categories directly
    const taskWithCategories = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      userId: task.userId,
      categories: task.categories.map((tc: CategoryRelation) => tc.category)
    };

    const response = NextResponse.json(taskWithCategories);
    
    // Set cache headers
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30');
    response.headers.set('ETag', eTag);
    
    return response;
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    
    if (!isValidTaskUpdateData(body)) {
      return NextResponse.json(
        { error: "Invalid request body" }, 
        { status: 400 }
      );
    }

    const { title, description, status, priority, dueDate, categoryIds = [] } = body;

    // FIX: Filter out null/undefined values from categoryIds
    const validCategoryIds = Array.isArray(categoryIds) 
      ? categoryIds.filter(id => id !== null && id !== undefined && id !== '')
      : [];

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
      select: {
        id: true
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Validate categories belong to the user if provided
    if (validCategoryIds.length > 0) {
      const userCategories = await prisma.category.findMany({
        where: {
          id: { in: validCategoryIds },
          userId: userId
        },
        select: {
          id: true
        }
      });

      if (userCategories.length !== validCategoryIds.length) {
        return NextResponse.json(
          { error: "Some categories do not exist or don't belong to you" },
          { status: 400 }
        );
      }
    }

    // Update the task with categories in a transaction for data consistency
    const task = await prisma.$transaction(async (tx) => {
      // First delete all existing category connections
      await tx.taskCategory.deleteMany({
        where: {
          taskId: params.id
        }
      });

      // Then update the task and create new category relationships
      return await tx.task.update({
        where: {
          id: params.id,
        },
        data: {
          title: title || "Untitled Task",
          description: description || "",
          status: status || "TODO",
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          categories: validCategoryIds.length > 0 ? {
            create: validCategoryIds.map((categoryId: string) => ({
              category: {
                connect: {
                  id: categoryId
                }
              }
            }))
          } : undefined // Only create if there are categories
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
            }
          }
        }
      });
    });

    // Transform the response to include categories directly
    const taskWithCategories = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      userId: task.userId,
      categories: task.categories.map((tc: CategoryRelation) => tc.category)
    };

    const response = NextResponse.json(taskWithCategories);
    
    // Set cache headers for the updated resource
    const eTag = generateETag(task);
    response.headers.set('Cache-Control', 'private, no-cache');
    response.headers.set('ETag', eTag);
    
    return response;
  } catch (error) {
    console.error("Error updating task:", error);
    
    // Handle Prisma errors specifically
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !isSessionUser(session.user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findUnique({
      where: {
        id: params.id,
        userId: userId,
      },
      select: {
        id: true
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Delete the task (Prisma will handle the category relationships due to onDelete: Cascade)
    await prisma.task.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    
    // Handle specific delete errors
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}