import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type {
  AddTaskCommand,
  ListTasksQuery,
  MarkTaskDoneCommand,
  DeleteTaskCommand,
  ListOverdueTasksQuery,
  RenameTaskCommand,
  ListTopPrioritiesQuery,
  DeleteAllTasksCommand,
  CompleteAllTasksCommand,
  ClearCompletedTasksCommand,
  UpdateTaskCommand,
  UpdateAllTasksPriorityCommand,
} from '../../domain/task/task-commands'

export type { AddTaskCommand } from '../../domain/task/task-commands'

import { AddTaskUseCase } from './add-task.use-case'
import { ListTasksUseCase } from './list-tasks.use-case'
import { MarkTaskDoneUseCase } from './mark-task-done.use-case'
import { DeleteTaskUseCase } from './delete-task.use-case'
import { ListOverdueTasksUseCase } from './list-overdue-tasks.use-case'
import { RenameTaskUseCase } from './rename-task.use-case'
import { ListTopPrioritiesUseCase } from './list-top-priorities.use-case'
import { DeleteAllTasksUseCase } from './delete-all-tasks.use-case'
import { CompleteAllTasksUseCase } from './complete-all-tasks.use-case'
import { ClearCompletedTasksUseCase } from './clear-completed-tasks.use-case'
import { UpdateTaskUseCase } from './update-task.use-case'
import { UpdateAllTasksPriorityUseCase } from './update-all-tasks-priority.use-case'
import { TaskFinder } from './task-finder'
import { TaskFormatter } from './task-formatter'

/**
 * Application service for task operations.
 * Orchestrates use cases and coordinates with the repository.
 */
export class TaskService {
  private readonly addTaskUseCase: AddTaskUseCase
  private readonly listTasksUseCase: ListTasksUseCase
  private readonly markTaskDoneUseCase: MarkTaskDoneUseCase
  private readonly deleteTaskUseCase: DeleteTaskUseCase
  private readonly listOverdueTasksUseCase: ListOverdueTasksUseCase
  private readonly renameTaskUseCase: RenameTaskUseCase
  private readonly listTopPrioritiesUseCase: ListTopPrioritiesUseCase
  private readonly deleteAllTasksUseCase: DeleteAllTasksUseCase
  private readonly completeAllTasksUseCase: CompleteAllTasksUseCase
  private readonly clearCompletedTasksUseCase: ClearCompletedTasksUseCase
  private readonly updateTaskUseCase: UpdateTaskUseCase
  private readonly updateAllTasksPriorityUseCase: UpdateAllTasksPriorityUseCase
  private readonly finder: TaskFinder
  private readonly formatter: TaskFormatter

  constructor(private readonly repository: TaskRepository) {
    this.finder = new TaskFinder(repository)
    this.addTaskUseCase = new AddTaskUseCase(repository)
    this.listTasksUseCase = new ListTasksUseCase(repository)
    this.markTaskDoneUseCase = new MarkTaskDoneUseCase(repository)
    this.deleteTaskUseCase = new DeleteTaskUseCase(repository)
    this.listOverdueTasksUseCase = new ListOverdueTasksUseCase(repository)
    this.renameTaskUseCase = new RenameTaskUseCase(repository)
    this.listTopPrioritiesUseCase = new ListTopPrioritiesUseCase(repository)
    this.deleteAllTasksUseCase = new DeleteAllTasksUseCase(repository)
    this.completeAllTasksUseCase = new CompleteAllTasksUseCase(repository)
    this.clearCompletedTasksUseCase = new ClearCompletedTasksUseCase(repository)
    this.updateTaskUseCase = new UpdateTaskUseCase(repository, this.finder)
    this.updateAllTasksPriorityUseCase = new UpdateAllTasksPriorityUseCase(repository)
    this.formatter = new TaskFormatter()
  }

  async addFromInput(input: AddTaskCommand): Promise<Task> {
    return this.addTaskUseCase.execute(input)
  }

  async listTasks(query: ListTasksQuery = {}): Promise<Task[]> {
    return this.listTasksUseCase.execute(query)
  }

  async markTaskDone(command: MarkTaskDoneCommand): Promise<Task> {
    return this.markTaskDoneUseCase.execute(command)
  }

  async deleteTask(command: DeleteTaskCommand): Promise<boolean> {
    return this.deleteTaskUseCase.execute(command)
  }

  async listOverdueTasks(query: ListOverdueTasksQuery = {}): Promise<Task[]> {
    return this.listOverdueTasksUseCase.execute(query)
  }

  async renameTask(command: RenameTaskCommand): Promise<Task> {
    return this.renameTaskUseCase.execute(command)
  }

  async listTopPriorities(query: ListTopPrioritiesQuery = {}): Promise<Task[]> {
    return this.listTopPrioritiesUseCase.execute(query)
  }

  async deleteAllTasks(_command: DeleteAllTasksCommand = {}): Promise<number> {
    return this.deleteAllTasksUseCase.execute()
  }

  async completeAllTasks(_command: CompleteAllTasksCommand = {}): Promise<Task[]> {
    return this.completeAllTasksUseCase.execute()
  }

  async clearCompletedTasks(_command: ClearCompletedTasksCommand = {}): Promise<number> {
    return this.clearCompletedTasksUseCase.execute()
  }

  async updateTask(command: UpdateTaskCommand): Promise<Task> {
    return this.updateTaskUseCase.execute(command)
  }

  async updateAllTasksPriority(command: UpdateAllTasksPriorityCommand): Promise<Task[]> {
    return this.updateAllTasksPriorityUseCase.execute(command)
  }

  /**
   * Find candidate tasks matching a user-provided identifier.
   * Used for ambiguity detection and clarification messages.
   */
  async findTasksByIdentifier(identifier: string): Promise<Task[]> {
    return this.finder.findCandidates(identifier)
  }

  formatTasksForChat(tasks: Task[]): string {
    return this.formatter.formatTasksForChat(tasks)
  }
}
