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
} from '../../domain/task/task-commands'

export type { AddTaskCommand } from '../../domain/task/task-commands'

import { AddTaskUseCase } from './add-task.use-case'
import { ListTasksUseCase } from './list-tasks.use-case'
import { MarkTaskDoneUseCase } from './mark-task-done.use-case'
import { DeleteTaskUseCase } from './delete-task.use-case'
import { ListOverdueTasksUseCase } from './list-overdue-tasks.use-case'
import { RenameTaskUseCase } from './rename-task.use-case'
import { ListTopPrioritiesUseCase } from './list-top-priorities.use-case'
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
  private readonly formatter: TaskFormatter

  constructor(private readonly repository: TaskRepository) {
    this.addTaskUseCase = new AddTaskUseCase(repository)
    this.listTasksUseCase = new ListTasksUseCase(repository)
    this.markTaskDoneUseCase = new MarkTaskDoneUseCase(repository)
    this.deleteTaskUseCase = new DeleteTaskUseCase(repository)
    this.listOverdueTasksUseCase = new ListOverdueTasksUseCase(repository)
    this.renameTaskUseCase = new RenameTaskUseCase(repository)
    this.listTopPrioritiesUseCase = new ListTopPrioritiesUseCase(repository)
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

  formatTasksForChat(tasks: Task[]): string {
    return this.formatter.formatTasksForChat(tasks)
  }
}
