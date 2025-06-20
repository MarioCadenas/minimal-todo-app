
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type Todo } from '../schema';

export const createTodo = async (input: CreateTodoInput): Promise<Todo> => {
  try {
    // Insert todo record
    const result = await db.insert(todosTable)
      .values({
        title: input.title,
        description: input.description || null,
        completed: false // Default value as specified in schema
      })
      .returning()
      .execute();

    // Return the created todo (timestamps are auto-generated)
    const todo = result[0];
    return {
      ...todo,
      description: todo.description // Ensure nullable field is handled correctly
    };
  } catch (error) {
    console.error('Todo creation failed:', error);
    throw error;
  }
};
