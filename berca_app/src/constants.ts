export const SessionDuration: Record<string, number> = {
  administrator: 1000 * 60 * 60 * 2, // 2 hours  (level 100)
  manager: 1000 * 60 * 60 * 4, // 4 hours  (level 80)
  supervisor: 1000 * 60 * 60 * 8, // 8 hours  (level 60)
  'senior-user': 1000 * 60 * 60 * 16, // 16 hours (level 40)
  user: 1000 * 60 * 60 * 24, // 24 hours (level 20)
}

export const DEFAULT_SESSION_DURATION = 1000 * 60 * 60
