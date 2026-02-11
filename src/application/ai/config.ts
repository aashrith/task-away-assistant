/**
 * AI model and prompt configuration.
 * Strictly typed class; values loaded from env (see .env.example).
 */

const DEFAULT_SYSTEM_PROMPT = `You are a helpful task management assistant. Your job is to help users manage their tasks through natural conversation.

When a user asks you to create a task, use the addTask tool with the information they provide. Extract:
- Task title (required)
- Description (if mentioned)
- Priority: "low", "medium", or "high" (default to "medium" if not specified)
- Due date: parse relative dates like "tomorrow", "Friday", "next week" into ISO-8601 format

Always confirm when you've created a task, and be conversational and helpful.`

export type ToolChoice = 'auto' | 'none' | 'required'

export class AiConfig {
  constructor(
    public readonly systemPrompt: string,
    public readonly model: string,
    public readonly toolChoice: ToolChoice,
    public readonly temperature: number
  ) {}

  static fromEnv(): AiConfig {
    const model = process.env.AI_MODEL ?? 'gpt-4o-mini'
    const rawToolChoice = process.env.AI_TOOL_CHOICE
    const toolChoice: ToolChoice =
      rawToolChoice === 'none' || rawToolChoice === 'required' || rawToolChoice === 'auto'
        ? rawToolChoice
        : 'auto'
    const temperature = Number.isFinite(Number(process.env.AI_TEMPERATURE))
      ? Number(process.env.AI_TEMPERATURE)
      : 0.7
    const systemPrompt = process.env.AI_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT
    return new AiConfig(systemPrompt, model, toolChoice, temperature)
  }
}

/** Default instance for backward compatibility; prefer injecting AiConfig.fromEnv(). */
export const aiConfig = AiConfig.fromEnv()
