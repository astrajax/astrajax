import {
  HOUSEHOLD_ACTIVITY_BASE_ID,
  HOUSEHOLD_ACTIVITY_TABLE_ID,
  HOUSEHOLD_SESSIONS_TABLE_ID,
} from "./ids";

const DEFAULT_IDLE_MINUTES = 30;

function envBoolean(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

export function platformSessionEnabled(): boolean {
  return envBoolean("PLATFORM_SESSION_ENABLED");
}

export function platformActivityEventWritesEnabled(): boolean {
  return envBoolean("PLATFORM_ACTIVITY_EVENT_WRITES_ENABLED");
}

export function getHouseholdBaseId(): string {
  return process.env.HOUSEHOLD_ACTIVITY_BASE_ID ?? HOUSEHOLD_ACTIVITY_BASE_ID;
}

export function getHouseholdSessionsTableId(): string {
  return process.env.HOUSEHOLD_SESSIONS_TABLE_ID ?? HOUSEHOLD_SESSIONS_TABLE_ID;
}

export function getHouseholdActivityTableId(): string {
  return process.env.HOUSEHOLD_ACTIVITY_TABLE_ID ?? HOUSEHOLD_ACTIVITY_TABLE_ID;
}

export function getHouseholdWriteToken(): string | undefined {
  return process.env.HOUSEHOLD_ACTIVITY_WRITE_TOKEN;
}

export function getHouseholdReadToken(): string | undefined {
  return process.env.HOUSEHOLD_ACTIVITY_READ_TOKEN;
}

export function getPlatformSessionSecret(): string | undefined {
  return process.env.PLATFORM_SESSION_SECRET;
}

export function getPlatformCronSecret(): string | undefined {
  return process.env.CRON_SECRET;
}

export function getPlatformIdleMinutes(): number {
  const parsed = Number.parseInt(process.env.PLATFORM_SESSION_IDLE_MINUTES ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_IDLE_MINUTES;
}

export function getPlatformOutboxPrefix(): string {
  return (process.env.PLATFORM_ACTIVITY_OUTBOX_PREFIX ?? "platform-activity/outbox/").replace(/^\/+/, "");
}

export function getPlatformDeadLetterPrefix(): string {
  return (process.env.PLATFORM_ACTIVITY_DLQ_PREFIX ?? "platform-activity/dead-letter/").replace(/^\/+/, "");
}

export function getPlatformLeasePrefix(): string {
  return (process.env.PLATFORM_SESSION_LEASE_PREFIX ?? "platform-activity/leases/").replace(/^\/+/, "");
}

export function getPlatformWorkerLockPath(): string {
  return process.env.PLATFORM_ACTIVITY_WORKER_LOCK_PATH ?? "platform-activity/locks/outbox-worker.json";
}

export function getPlatformQueueAgeAlertSeconds(): number {
  const parsed = Number.parseInt(process.env.PLATFORM_ACTIVITY_QUEUE_ALERT_SECONDS ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120;
}

export function getPlatformMaxAttempts(): number {
  const parsed = Number.parseInt(process.env.PLATFORM_ACTIVITY_MAX_ATTEMPTS ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 6;
}
