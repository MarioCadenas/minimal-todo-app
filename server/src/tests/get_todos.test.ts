
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          completed: false
        },
        {
          title: 'Second Todo',
          description: null,
          completed: true
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    
    // Verify all required fields are present
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(todo.title).toBeDefined();
      expect(typeof todo.completed).toBe('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific todo data
    const titles = result.map(t => t.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
  });

  it('should return todos ordered by creation date (newest first)', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({
        title: 'Older Todo',
        description: 'Created first',
        completed: false
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({
        title: 'Newer Todo',
        description: 'Created second',
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Todo');
    expect(result[1].title).toEqual('Older Todo');
    
    // Verify ordering by timestamp
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle todos with null descriptions', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Todo with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
  });
});
