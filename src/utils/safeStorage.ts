import type { StateStorage } from 'zustand/middleware'

const memoryValues = new Map<string, string>()
const memoryStorage: StateStorage = {
  getItem: (name) => memoryValues.get(name) ?? null,
  setItem: (name, value) => { memoryValues.set(name, value) },
  removeItem: (name) => { memoryValues.delete(name) },
}

/**
 * localStorage when the browser allows it, otherwise an in-memory fallback.
 * Private windows, sandboxes and the test runner can all reject storage access.
 */
export function safeStorage(): StateStorage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // Fall through to memory storage.
  }
  return memoryStorage
}
