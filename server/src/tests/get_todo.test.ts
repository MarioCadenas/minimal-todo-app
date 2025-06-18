
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

// Test input
const testTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return todo when it exists', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values(testTodoInput)
      .returning()
      .execute();

    const input: GetTodoInput = { id: createdTodo.id };
    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A todo for testing');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    const input: GetTodoInput = { id: 999 };
    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should return correct todo when multiple todos exist', async () => {
    // Create multiple test todos
    const todos = await db.insert(todosTable)
      .values([
        { title: 'First Todo', description: 'First description' },
        { title: 'Second Todo', description: 'Second description' },
        { title: 'Third Todo', description: 'Third description' }
      ])
      .returning()
      .execute();

    // Get the second todo
    const input: GetTodoInput = { id: todos[1].id };
    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todos[1].id);
    expect(result!.title).toEqual('Second Todo');
    expect(result!.description).toEqual('Second description');
  });
});
