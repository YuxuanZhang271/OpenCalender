import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const knownEventTypes = [
  "id",
  "title",
  "startDate",
  "deadline",
  "eventType",
  "address",
  "details",
  "extra",
];

const knownReminderTypes = [
  "id",
  "message",
  "time",
  "extra",
];

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--validate")) {
    const fileIndex = args.indexOf("--file");
    if (fileIndex === -1 || !args[fileIndex + 1]) {
      throw new Error("Missing --file for validation mode.");
    }

    const filePath = resolve(process.cwd(), args[fileIndex + 1]);
    const raw = JSON.parse(await readFile(filePath, "utf8"));
    const normalized = normalizeCalendarData(raw);
    console.log(`Validated ${filePath}: ${normalized.events.length} events, ${normalized.reminders.length} reminders.`);
    return;
  }

  const payload = process.env.CALENDAR_PAYLOAD;
  const targetPath = process.env.CALENDAR_PATH;

  if (!payload || !targetPath) {
    throw new Error("CALENDAR_PAYLOAD and CALENDAR_PATH must be set.");
  }

  const decoded = Buffer.from(payload, "base64").toString("utf8");
  const parsed = JSON.parse(decoded);
  const normalized = normalizeCalendarData(parsed);
  const outputPath = resolve(process.cwd(), targetPath);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

function normalizeCalendarData(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Calendar payload must be an object.");
  }

  const events = Array.isArray(raw.events) ? raw.events : [];
  const reminders = Array.isArray(raw.reminders) ? raw.reminders : [];

  return {
    version: Number(raw.version) || 1,
    updatedAt: normalizeTimestamp(raw.updatedAt || new Date().toISOString()),
    events: events.map((event, index) => normalizeEvent(event, index)).sort(compareByKey("deadline")),
    reminders: reminders.map((reminder, index) => normalizeReminder(reminder, index)).sort(compareByKey("time")),
  };
}

function normalizeEvent(event, index) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new Error(`Event at index ${index} must be an object.`);
  }

  const title = requireString(event.title, `events[${index}].title`);
  const startDate = normalizeLocalDateTime(event.startDate, `events[${index}].startDate`);
  const deadline = normalizeLocalDateTime(event.deadline, `events[${index}].deadline`);

  if (startDate > deadline) {
    throw new Error(`events[${index}] has startDate after deadline.`);
  }

  return {
    id: requireString(event.id, `events[${index}].id`),
    title,
    startDate,
    deadline,
    eventType: requireString(event.eventType || "General", `events[${index}].eventType`),
    address: String(event.address || "Not set").trim() || "Not set",
    details: String(event.details || "").trim(),
    extra: normalizeExtra(event.extra, event, knownEventTypes),
  };
}

function normalizeReminder(reminder, index) {
  if (!reminder || typeof reminder !== "object" || Array.isArray(reminder)) {
    throw new Error(`Reminder at index ${index} must be an object.`);
  }

  return {
    id: requireString(reminder.id, `reminders[${index}].id`),
    message: requireString(reminder.message, `reminders[${index}].message`),
    time: normalizeLocalDateTime(reminder.time, `reminders[${index}].time`),
    extra: normalizeExtra(reminder.extra, reminder, knownReminderTypes),
  };
}

function normalizeExtra(extra, fallbackSource, knownKeys) {
  const known = new Set(knownKeys);
  const source = extra && typeof extra === "object" && !Array.isArray(extra)
    ? extra
    : Object.fromEntries(
        Object.entries(fallbackSource).filter(([key, value]) => !known.has(key) && value !== undefined && value !== null && value !== ""),
      );

  return Object.entries(source).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null || value === "") {
      return accumulator;
    }
    accumulator[key] = String(value);
    return accumulator;
  }, {});
}

function normalizeLocalDateTime(value, label) {
  const raw = requireString(value, label);
  const normalized = raw.includes(" ") ? raw.replace(" ", "T") : raw;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid datetime.`);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function compareByKey(key) {
  return (left, right) => new Date(left[key]) - new Date(right[key]);
}

function requireString(value, label) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }
  return normalized;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
