/**
 * AI application module — public API.
 * Server and other adapters import from here.
 */

export type {
  ChatRequest,
  ChatError,
  CoreMessage,
  ToolDefinition,
  ReasoningResult,
  ReasoningContext,
} from './types'
export { aiConfig, AiConfig, type ToolChoice } from './config'
export {
  addTaskParameters,
  addTaskArgsSchema,
  listTasksArgsSchema,
  markTaskDoneArgsSchema,
  deleteTaskArgsSchema,
  listOverdueTasksArgsSchema,
  toolSchemasByName,
  requiredFieldsPerIntent,
  type AddTaskInput,
} from './tool-schemas'
export { intentOutputSchema, REASONING_SYSTEM, clarificationHints } from './intent'
export { reason } from './reasoning-service'
