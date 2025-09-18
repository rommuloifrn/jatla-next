"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, GripVertical, X } from "lucide-react"

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface TodoList {
  id: string
  title: string
  todos: Todo[]
}

const STORAGE_KEY = "todoLists"

export default function Component() {
  const [lists, setLists] = useState<TodoList[]>([])
  const [newListTitle, setNewListTitle] = useState("")
  const [newTodos, setNewTodos] = useState<{ [key: string]: string }>({})
  const [draggedListId, setDraggedListId] = useState<string | null>(null)
  const [draggedTodo, setDraggedTodo] = useState<{ listId: string; todoId: string } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedLists = localStorage.getItem(STORAGE_KEY)
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists)
        setLists(parsedLists)
      } else {
        // Initialize with sample data if no saved data exists
        const sampleLists: TodoList[] = [
          {
            id: "1",
            title: "Work Tasks",
            todos: [
              { id: "1", text: "Review project proposal", completed: false },
              { id: "2", text: "Update documentation", completed: true },
              { id: "3", text: "Prepare presentation", completed: false },
            ],
          },
          {
            id: "2",
            title: "Personal",
            todos: [
              { id: "4", text: "Buy groceries", completed: false },
              { id: "5", text: "Call dentist", completed: false },
              { id: "6", text: "Exercise", completed: true },
            ],
          },
        ]
        setLists(sampleLists)
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error)
      setLists([])
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save data to localStorage whenever lists change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
      } catch (error) {
        console.error("Error saving data to localStorage:", error)
      }
    }
  }, [lists, isLoaded])

  const addList = () => {
    if (newListTitle.trim()) {
      const newList: TodoList = {
        id: Date.now().toString(),
        title: newListTitle,
        todos: [],
      }
      setLists([...lists, newList])
      setNewListTitle("")
    }
  }

  const deleteList = (listId: string) => {
    setLists(lists.filter((list) => list.id !== listId))
  }

  const addTodo = (listId: string) => {
    const todoText = newTodos[listId]
    if (todoText?.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: todoText,
        completed: false,
      }
      setLists(lists.map((list) => (list.id === listId ? { ...list, todos: [...list.todos, newTodo] } : list)))
      setNewTodos({ ...newTodos, [listId]: "" })
    }
  }

  const toggleTodo = (listId: string, todoId: string) => {
    setLists(
      lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              todos: list.todos.map((todo) => (todo.id === todoId ? { ...todo, completed: !todo.completed } : todo)),
            }
          : list,
      ),
    )
  }

  const deleteTodo = (listId: string, todoId: string) => {
    setLists(
      lists.map((list) =>
        list.id === listId ? { ...list, todos: list.todos.filter((todo) => todo.id !== todoId) } : list,
      ),
    )
  }

  // List drag handlers
  const handleListDragStart = (e: React.DragEvent, listId: string) => {
    setDraggedListId(listId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", "")
  }

  const handleListDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleListDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedListId || draggedListId === targetListId) {
      setDraggedListId(null)
      return
    }

    const draggedIndex = lists.findIndex((list) => list.id === draggedListId)
    const targetIndex = lists.findIndex((list) => list.id === targetListId)

    const newLists = [...lists]
    const [draggedList] = newLists.splice(draggedIndex, 1)
    newLists.splice(targetIndex, 0, draggedList)

    setLists(newLists)
    setDraggedListId(null)
  }

  const handleListDragEnd = () => {
    setDraggedListId(null)
  }

  // Todo drag handlers
  const handleTodoDragStart = (e: React.DragEvent, listId: string, todoId: string) => {
    setDraggedTodo({ listId, todoId })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", "")
    e.stopPropagation()
  }

  const handleTodoDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
  }

  const handleTodoDrop = (e: React.DragEvent, targetListId: string, targetTodoId?: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedTodo) return

    const { listId: sourceListId, todoId: sourceTodoId } = draggedTodo

    // Find the source todo
    const sourceList = lists.find((list) => list.id === sourceListId)
    const sourceTodo = sourceList?.todos.find((todo) => todo.id === sourceTodoId)

    if (!sourceTodo) {
      setDraggedTodo(null)
      return
    }

    // If dropping in the same position, do nothing
    if (sourceListId === targetListId && sourceTodoId === targetTodoId) {
      setDraggedTodo(null)
      return
    }

    const newLists = lists.map((list) => {
      if (list.id === sourceListId) {
        // Remove todo from source list
        return {
          ...list,
          todos: list.todos.filter((todo) => todo.id !== sourceTodoId),
        }
      }
      return list
    })

    // Add todo to target list
    const updatedLists = newLists.map((list) => {
      if (list.id === targetListId) {
        const newTodos = [...list.todos]

        if (targetTodoId) {
          // Insert at specific position
          const targetIndex = newTodos.findIndex((todo) => todo.id === targetTodoId)
          newTodos.splice(targetIndex, 0, sourceTodo)
        } else {
          // Add to end of list
          newTodos.push(sourceTodo)
        }

        return {
          ...list,
          todos: newTodos,
        }
      }
      return list
    })

    setLists(updatedLists)
    setDraggedTodo(null)
  }

  const handleTodoDragEnd = () => {
    setDraggedTodo(null)
  }

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all todo lists? This action cannot be undone.")) {
      setLists([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Show loading state until data is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your todo lists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-center flex-1">Multi-List Todo App</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllData}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
          >
            Clear All Data
          </Button>
        </div>

        {/* Add New List */}
        <div className="mb-8 flex justify-center">
          <div className="flex gap-2 w-full max-w-md">
            <Input
              placeholder="New list title..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addList()}
            />
            <Button onClick={addList}>
              <Plus className="w-4 h-4 mr-2" />
              Add List
            </Button>
          </div>
        </div>

        {/* Todo Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Card
              key={list.id}
              onDragOver={handleListDragOver}
              onDrop={(e) => handleListDrop(e, list.id)}
              className={`transition-all duration-200 ${
                draggedListId === list.id ? "opacity-50 scale-95" : "hover:shadow-lg"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      draggable
                      onDragStart={(e) => handleListDragStart(e, list.id)}
                      onDragEnd={handleListDragEnd}
                      className="cursor-move p-1 hover:bg-gray-100 rounded"
                      title="Drag to reorder lists"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <CardTitle className="text-lg">{list.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteList(list.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Add Todo Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a task..."
                    value={newTodos[list.id] || ""}
                    onChange={(e) => setNewTodos({ ...newTodos, [list.id]: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addTodo(list.id)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={() => addTodo(list.id)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {/* Todo Items */}
                <div
                  className="space-y-2 max-h-64 overflow-y-auto"
                  onDragOver={handleTodoDragOver}
                  onDrop={(e) => handleTodoDrop(e, list.id)}
                >
                  {list.todos.map((todo) => (
                    <div
                      key={todo.id}
                      draggable
                      onDragStart={(e) => handleTodoDragStart(e, list.id, todo.id)}
                      onDragOver={handleTodoDragOver}
                      onDrop={(e) => handleTodoDrop(e, list.id, todo.id)}
                      onDragEnd={handleTodoDragEnd}
                      className={`flex items-center justify-between p-2 rounded-md bg-white border transition-all cursor-move ${
                        todo.completed ? "bg-gray-50" : ""
                      } ${draggedTodo?.todoId === todo.id ? "opacity-50 scale-95" : "hover:shadow-sm"}`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1">
                          <GripVertical className="w-3 h-3 text-gray-300" />
                          <Checkbox
                            id={`${list.id}-${todo.id}`}
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(list.id, todo.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <label
                          htmlFor={`${list.id}-${todo.id}`}
                          className={`text-sm cursor-pointer flex-1 ${
                            todo.completed ? "line-through text-gray-500" : ""
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {todo.text}
                        </label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTodo(list.id, todo.id)
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {list.todos.length === 0 && (
                    <div
                      className="text-gray-500 text-sm text-center py-8 border-2 border-dashed border-gray-200 rounded-md"
                      onDragOver={handleTodoDragOver}
                      onDrop={(e) => handleTodoDrop(e, list.id)}
                    >
                      No tasks yet. Add one above or drag a task here!
                    </div>
                  )}
                </div>

                {/* List Stats */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  {list.todos.length} total, {list.todos.filter((t) => t.completed).length} completed
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {lists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No todo lists yet!</p>
            <p className="text-gray-400">Create your first list above to get started.</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-400">✓ All changes are automatically saved to your browser's local storage</p>
          <p className="text-xs text-gray-400">
            💡 Drag lists by the grip icon • Drag todos anywhere to reorder or move between lists
          </p>
        </div>
      </div>
    </div>
  )
}
