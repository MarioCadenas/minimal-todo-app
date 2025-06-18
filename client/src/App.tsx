
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Edit, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || false;
  });
  
  const [newTodo, setNewTodo] = useState<CreateTodoInput>({
    title: '',
    description: null
  });
  
  const [editForm, setEditForm] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null,
    completed: false
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load todos from API
  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  // Create todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createTodo.mutate(newTodo);
      setTodos((prev: Todo[]) => [response, ...prev]);
      setNewTodo({ title: '', description: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update todo
  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title?.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateTodo.mutate(editForm);
      setTodos((prev: Todo[]) => prev.map((todo: Todo) => 
        todo.id === response.id ? response : todo
      ));
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle completion status
  const toggleTodoComplete = async (todo: Todo) => {
    try {
      const response = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) => prev.map((t: Todo) => 
        t.id === response.id ? response : t
      ));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  // Delete todo
  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditForm({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed
    });
    setIsEditDialogOpen(true);
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              ✅ Todo App
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {totalCount === 0 ? 'No tasks yet' : `${completedCount} of ${totalCount} completed`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              className={`${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTodo} className="space-y-4">
                  <Input
                    placeholder="Task title"
                    value={newTodo.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTodo((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                    }
                    className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}
                    required
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newTodo.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewTodo((prev: CreateTodoInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm">{Math.round((completedCount / totalCount) * 100)}%</span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Todo List */}
        {todos.length === 0 ? (
          <Card className={`text-center py-12 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
            <CardContent>
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Create your first task to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todos.map((todo: Todo) => (
              <Card
                key={todo.id}
                className={`transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white hover:shadow-md'
                } ${todo.completed ? 'opacity-75' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTodoComplete(todo)}
                      className="mt-1 transition-colors hover:scale-110"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium ${todo.completed ? 'line-through' : ''}`}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className={`text-sm mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            } ${todo.completed ? 'line-through' : ''}`}>
                              {todo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant={todo.completed ? "default" : "secondary"}
                              className={`text-xs ${
                                todo.completed 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {todo.completed ? 'Completed' : 'Pending'}
                            </Badge>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {todo.created_at.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(todo)}
                            className={`h-8 w-8 p-0 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} hover:text-red-500`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTodo(todo.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <Input
                placeholder="Task title"
                value={editForm.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((prev: UpdateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}
                required
              />
              <Textarea
                placeholder="Description (optional)"
                value={editForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditForm((prev: UpdateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}
                rows={3}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={editForm.completed || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditForm((prev: UpdateTodoInput) => ({ ...prev, completed: checked }))
                  }
                />
                <label htmlFor="completed" className="text-sm font-medium">
                  Mark as completed
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
