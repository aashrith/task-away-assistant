import type { Task, TaskId } from './Task'

/**
 * Abstraction over task persistence.
 *
 * Implementations (in-memory, SQLite, etc.) live in the infrastructure layer.
 * This is modelled as an abstract class so concrete repositories can extend it.
 */
export abstract class TaskRepository {
  /**
   * Persist a new task.
   */
  abstract add(task: Task): Promise<Task>

  /**
   * Look up a task by id.
   */
  abstract getById(id: TaskId): Promise<Task | null>

  /**
   * Fetch all tasks.
   *
   * Filtering, sorting, and projections are handled in the application layer.
   */
  abstract list(): Promise<Task[]>

  /**
   * Update an existing task.
   *
   * Returns the updated task or null if it does not exist.
   */
  abstract update(task: Task): Promise<Task | null>

  /**
   * Delete a task by id.
   *
   * Returns true if a task was deleted, false otherwise.
   */
  abstract delete(id: TaskId): Promise<boolean>
}


