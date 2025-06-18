
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a todo successfully', async () => {
    // Create a test todo first
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const todoId = testTodo[0].id;
    const input: DeleteTodoInput = { id: todoId };

    // Delete the todo
    const result = await deleteTodo(input);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the todo is actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should throw error when todo does not exist', async () => {
    const input: DeleteTodoInput = { id: 999 };

    // Attempt to delete non-existent todo
    await expect(deleteTodo(input)).rejects.toThrow(/Todo with ID 999 not found/i);
  });

  it('should not affect other todos', async () => {
    // Create multiple test todos
    const todos = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', completed: false },
        { title: 'Todo 2', description: 'Second todo', completed: true },
        { title: 'Todo 3', description: 'Third todo', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = todos[1].id;
    const input: DeleteTodoInput = { id: todoToDelete };

    // Delete the middle todo
    const result = await deleteTodo(input);
    expect(result.success).toBe(true);

    // Verify only the target todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.some(todo => todo.id === todoToDelete)).toBe(false);
    expect(remainingTodos.some(todo => todo.id === todos[0].id)).toBe(true);
    expect(remainingTodos.some(todo => todo.id === todos[2].id)).toBe(true);
  });
});
