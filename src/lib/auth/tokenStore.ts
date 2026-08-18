type Listener = (token: string | null) => void

let accessToken: string | null = null
const listeners = new Set<Listener>()

export const tokenStore = {
  get(): string | null {
    return accessToken
  },
  set(token: string | null): void {
    accessToken = token
    listeners.forEach((listener) => listener(token))
  },
  clear(): void {
    accessToken = null
    listeners.forEach((listener) => listener(null))
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}