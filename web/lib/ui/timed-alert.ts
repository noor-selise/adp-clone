export const ALERT_MS = 4000

export const isAlertExpired = (shownAt: number, now: number, ttl = ALERT_MS) => now - shownAt >= ttl
