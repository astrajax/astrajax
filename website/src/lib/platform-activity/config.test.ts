import { afterEach, describe, expect, it } from "vitest";
import {
  getPlatformDeadLetterPrefix,
  getPlatformIdleMinutes,
  getPlatformMaxAttempts,
  getPlatformOutboxPrefix,
  getPlatformQueueAgeAlertSeconds,
  platformActivityEventWritesEnabled,
  platformSessionEnabled,
} from "./config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("platform-activity config", () => {
  it("treats only true/1 and false/0 as explicit booleans", () => {
    delete process.env.PLATFORM_SESSION_ENABLED;
    expect(platformSessionEnabled()).toBe(false);

    process.env.PLATFORM_SESSION_ENABLED = "true";
    expect(platformSessionEnabled()).toBe(true);

    process.env.PLATFORM_ACTIVITY_EVENT_WRITES_ENABLED = "1";
    expect(platformActivityEventWritesEnabled()).toBe(true);

    process.env.PLATFORM_ACTIVITY_EVENT_WRITES_ENABLED = "0";
    expect(platformActivityEventWritesEnabled()).toBe(false);

    process.env.PLATFORM_SESSION_ENABLED = "yes";
    expect(platformSessionEnabled()).toBe(false);
  });

  it("falls back to defaults for invalid or missing numeric env", () => {
    delete process.env.PLATFORM_SESSION_IDLE_MINUTES;
    expect(getPlatformIdleMinutes()).toBe(30);

    process.env.PLATFORM_SESSION_IDLE_MINUTES = "0";
    expect(getPlatformIdleMinutes()).toBe(30);

    process.env.PLATFORM_SESSION_IDLE_MINUTES = "abc";
    expect(getPlatformIdleMinutes()).toBe(30);

    process.env.PLATFORM_SESSION_IDLE_MINUTES = "45";
    expect(getPlatformIdleMinutes()).toBe(45);

    delete process.env.PLATFORM_ACTIVITY_MAX_ATTEMPTS;
    expect(getPlatformMaxAttempts()).toBe(6);

    delete process.env.PLATFORM_ACTIVITY_QUEUE_ALERT_SECONDS;
    expect(getPlatformQueueAgeAlertSeconds()).toBe(120);
  });

  it("strips leading slashes from blob prefixes", () => {
    process.env.PLATFORM_ACTIVITY_OUTBOX_PREFIX = "/platform-activity/outbox/";
    process.env.PLATFORM_ACTIVITY_DLQ_PREFIX = "///platform-activity/dead-letter/";

    expect(getPlatformOutboxPrefix()).toBe("platform-activity/outbox/");
    expect(getPlatformDeadLetterPrefix()).toBe("platform-activity/dead-letter/");
  });
});
