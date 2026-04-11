import {
  DATETIME_FORMATTER,
  EVENT_TYPE_COLORS,
  EVENT_TYPE_FALLBACK_PALETTE,
} from "./config.mjs";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function safeReadJson(response) {
  return response.json().catch(() => null);
}

export function openModal(modal) {
  if (!modal) {
    return;
  }

  if (typeof modal.showModal === "function") {
    if (modal.open) {
      modal.close();
    }
    modal.showModal();
    return;
  }

  modal.setAttribute("open", "true");
  document.body.classList.add("has-fallback-modal");
}

export function closeModal(modal) {
  if (!modal) {
    return;
  }

  if (typeof modal.close === "function") {
    if (modal.open) {
      modal.close();
    }
  } else {
    modal.removeAttribute("open");
  }

  if (!document.querySelector("dialog[open]")) {
    document.body.classList.remove("has-fallback-modal");
  }
}

export function getInitialTheme(storageKey) {
  const savedTheme = window.localStorage.getItem(storageKey);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme, themeToggle) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";

  if (themeToggle) {
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
  }
}

export function startOfDay(date) {
  const normalized = new Date(date);
  return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate());
}

export function startOfMonth(date) {
  const normalized = new Date(date);
  return new Date(normalized.getFullYear(), normalized.getMonth(), 1);
}

export function endOfMonth(date) {
  const normalized = new Date(date);
  return new Date(normalized.getFullYear(), normalized.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return startOfDay(result);
}

export function addMonths(date, months) {
  const result = new Date(date);
  return new Date(result.getFullYear(), result.getMonth() + months, 1);
}

export function addInterval(date, amount, unit) {
  const next = new Date(date);

  if (unit === "hour") {
    next.setHours(next.getHours() + amount);
    return next;
  }

  if (unit === "week") {
    next.setDate(next.getDate() + amount * 7);
    return next;
  }

  if (unit === "month") {
    next.setMonth(next.getMonth() + amount);
    return next;
  }

  next.setDate(next.getDate() + amount);
  return next;
}

export function compareDays(left, right) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

export function formatDateTime(date) {
  return DATETIME_FORMATTER.format(date);
}

export function parseDateValue(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const dateOnly = new Date(`${raw}T00:00`);
  return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
}

export function normalizePositiveInteger(value, fallback = 1) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

export function normalizeRecurrenceUnit(value) {
  const normalized = String(value || "day").trim().toLowerCase();
  return ["hour", "day", "week", "month"].includes(normalized) ? normalized : "day";
}

export function normalizeTypeKey(value) {
  return String(value || "general")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "general";
}

export function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getEventTypeColor(typeKey) {
  if (EVENT_TYPE_COLORS[typeKey]) {
    return EVENT_TYPE_COLORS[typeKey];
  }

  return EVENT_TYPE_FALLBACK_PALETTE[hashString(typeKey) % EVENT_TYPE_FALLBACK_PALETTE.length];
}

export function chunk(values, size) {
  const output = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

export function dateIndexInGrid(monthGrid, targetDate) {
  return monthGrid.findIndex((date) => compareDays(date, targetDate));
}

export function maxDate(...dates) {
  return dates.reduce((latest, current) => (current > latest ? current : latest));
}

export function minDate(...dates) {
  return dates.reduce((earliest, current) => (current < earliest ? current : earliest));
}

export function toDateTimeLocalValue(date) {
  if (!date) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export function toIsoMinuteString(date) {
  const normalized = new Date(date);
  normalized.setSeconds(0, 0);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  const hours = String(normalized.getHours()).padStart(2, "0");
  const minutes = String(normalized.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getDefaultEventDeadline(startDate) {
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + 1);
  deadline.setHours(23, 59, 0, 0);
  return deadline;
}

export function getDefaultReminderTime() {
  return addDays(new Date(), 1);
}

export function pluralizeUnit(unit, amount) {
  return amount === 1 ? unit : `${unit}s`;
}

export function createItemId(prefix, label, date, index) {
  const normalizedLabel = String(label || prefix)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || prefix;
  const stamp = toIsoMinuteString(date || new Date()).replace(/[^0-9]/g, "").slice(0, 12);
  return `${prefix}-${stamp}-${index + 1}-${normalizedLabel}`;
}
