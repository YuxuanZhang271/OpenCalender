import { APP_CONFIG, STORAGE_KEYS } from "./config.mjs";
import {
  createItemId,
  normalizePositiveInteger,
  normalizeRecurrenceUnit,
  normalizeTypeKey,
  parseDateValue,
  startOfDay,
  toIsoMinuteString,
} from "./utils.mjs";

export function createEmptyCalendarData() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    events: [],
    reminders: [],
  };
}

export async function loadRepositoryData() {
  const response = await fetch(APP_CONFIG.dataPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${APP_CONFIG.dataPath}: ${response.status}`);
  }

  return normalizeCalendarData(await response.json());
}

export function normalizeCalendarData(rawData = {}) {
  const events = Array.isArray(rawData.events) ? rawData.events : [];
  const reminders = Array.isArray(rawData.reminders) ? rawData.reminders : [];

  return {
    version: Number(rawData.version) || 1,
    updatedAt: normalizeTimestamp(rawData.updatedAt),
    events: events.map(normalizeEvent).filter(Boolean).sort(byDate("deadline")),
    reminders: reminders.map(normalizeReminder).filter(Boolean).sort(byDate("time")),
  };
}

function normalizeEvent(event, index) {
  const title = normalizeText(event?.title);
  const deadline = parseDateValue(event?.deadline);
  if (!title || !deadline) {
    return null;
  }

  const startDate = parseDateValue(event?.startDate);
  const safeStartDate = startDate && startDate <= deadline ? startDate : startOfDay(deadline);
  const eventType = normalizeText(event?.eventType, "General");

  return {
    id: normalizeText(event?.id, createItemId("event", title, deadline, index || 0)),
    kind: "event",
    title,
    startDate: safeStartDate,
    deadline,
    completed: Boolean(event?.completed),
    eventType,
    eventTypeKey: normalizeTypeKey(eventType),
    address: normalizeText(event?.address, "Not set"),
    details: normalizeText(event?.details),
    extra: normalizeExtra(event?.extra),
  };
}

function normalizeReminder(reminder, index) {
  const message = normalizeText(reminder?.message);
  const time = parseDateValue(reminder?.time);
  if (!message || !time) {
    return null;
  }

  const recurring = Boolean(reminder?.recurring);

  return {
    id: normalizeText(reminder?.id, createItemId("reminder", message, time, index || 0)),
    kind: "reminder",
    message,
    time,
    completed: Boolean(reminder?.completed),
    completedAt: parseDateValue(reminder?.completedAt),
    recurring,
    recurrenceInterval: recurring ? normalizePositiveInteger(reminder?.recurrenceInterval, 1) : 1,
    recurrenceUnit: normalizeRecurrenceUnit(reminder?.recurrenceUnit || "day"),
    lastCompletedAt: parseDateValue(reminder?.lastCompletedAt),
    extra: normalizeExtra(reminder?.extra),
  };
}

function normalizeText(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeExtra(extra) {
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
    return {};
  }

  return Object.entries(extra).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null || value === "") {
      return accumulator;
    }

    accumulator[key] = String(value);
    return accumulator;
  }, {});
}

function normalizeTimestamp(value) {
  const parsed = new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function byDate(key) {
  return (left, right) => left[key] - right[key];
}

export function loadStoredGithubSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.githubSettings);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

export function mergeGithubSettings(storedSettings = {}) {
  return {
    ...APP_CONFIG.github,
    ...(storedSettings || {}),
  };
}

export function loadDraft() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.draftData);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function persistDraft(state) {
  state.dirty = true;
  state.data.updatedAt = new Date().toISOString();
  window.localStorage.setItem(
    STORAGE_KEYS.draftData,
    JSON.stringify(toPlainCalendarData(state.data)),
  );
}

export function clearDraft(state) {
  state.dirty = false;
  window.localStorage.removeItem(STORAGE_KEYS.draftData);
}

export function toPlainCalendarData(data) {
  return {
    version: data.version || 1,
    updatedAt: data.updatedAt || new Date().toISOString(),
    events: data.events.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: toIsoMinuteString(event.startDate),
      deadline: toIsoMinuteString(event.deadline),
      completed: Boolean(event.completed),
      eventType: event.eventType,
      address: event.address,
      details: event.details,
      extra: event.extra || {},
    })),
    reminders: data.reminders.map((reminder) => ({
      id: reminder.id,
      message: reminder.message,
      time: toIsoMinuteString(reminder.time),
      completed: Boolean(reminder.completed),
      completedAt: reminder.completedAt ? toIsoMinuteString(reminder.completedAt) : "",
      recurring: Boolean(reminder.recurring),
      recurrenceInterval: reminder.recurrenceInterval || 1,
      recurrenceUnit: reminder.recurrenceUnit || "day",
      lastCompletedAt: reminder.lastCompletedAt ? toIsoMinuteString(reminder.lastCompletedAt) : "",
      extra: reminder.extra || {},
    })),
  };
}

export function serializeCalendarData(data) {
  const json = JSON.stringify(toPlainCalendarData(data), null, 2);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return window.btoa(binary);
}

export function buildCommitMessage(data) {
  return `chore: sync calendar data (${data.events.length} events, ${data.reminders.length} reminders)`;
}
