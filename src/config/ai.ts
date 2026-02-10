export const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto'

export const OPENROUTER_MODEL = (
  import.meta.env.VITE_OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
).trim() || DEFAULT_OPENROUTER_MODEL

export const OPENROUTER_CHAT_ENDPOINT = '/api/openrouter/v1/chat'
