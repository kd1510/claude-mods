export type TodoItem = { id: number; text: string; isDone: boolean }

declare module 'claude-code' {
  interface PluginState {
    todo: { items: TodoItem[]; draft: string }
  }
}
