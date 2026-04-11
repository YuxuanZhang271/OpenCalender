const RAW_CONFIG = window.OPEN_CALENDAR_CONFIG || {};

const DEFAULT_DATA_PATH = "../database/calendar-data.json";
const DEFAULT_DISPATCH_EVENT = "calendar_data_sync";

const APP_CONFIG = {
  appTitle: "OpenCalendar",
  subtitle: "A desktop-ready planner for the next six months.",
  monthsToRender: 6,
  upcomingDays: 5,
  menuBarHeight: 37,
  viewportWidth: 1280,
  viewportHeight: 832,
  dataSources: {
    calendar: DEFAULT_DATA_PATH,
    events: "../database/events.csv",
    reminders: "../database/reminders.csv",
    ...(RAW_CONFIG.dataSources || {}),
  },
  github: {
    owner: "",
    repo: "",
    branch: "main",
    dataPath: "database/calendar-data.json",
    commitMode: "actions",
    dispatchEventType: DEFAULT_DISPATCH_EVENT,
    token: "",
    ...(RAW_CONFIG.github || {}),
  },
  ...RAW_CONFIG,
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DATETIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});
const MAX_EVENT_LANES = 3;
const THEME_STORAGE_KEY = "open-calendar-theme";
const GITHUB_SETTINGS_STORAGE_KEY = "open-calendar-github-settings";
const DRAFT_STORAGE_KEY = "open-calendar-draft-data";

const EVENT_TYPE_COLORS = {
  personal: {
    soft: "rgba(226, 141, 116, 0.18)",
    strong: "rgba(226, 141, 116, 0.72)",
    border: "rgba(193, 103, 79, 0.32)",
  },
  work: {
    soft: "rgba(107, 155, 141, 0.18)",
    strong: "rgba(107, 155, 141, 0.76)",
    border: "rgba(74, 119, 106, 0.34)",
  },
  health: {
    soft: "rgba(214, 167, 94, 0.18)",
    strong: "rgba(214, 167, 94, 0.76)",
    border: "rgba(170, 129, 65, 0.32)",
  },
  academic: {
    soft: "rgba(122, 138, 204, 0.18)",
    strong: "rgba(122, 138, 204, 0.78)",
    border: "rgba(92, 107, 170, 0.34)",
  },
  admin: {
    soft: "rgba(162, 134, 112, 0.18)",
    strong: "rgba(162, 134, 112, 0.74)",
    border: "rgba(121, 97, 79, 0.34)",
  },
  travel: {
    soft: "rgba(91, 162, 185, 0.18)",
    strong: "rgba(91, 162, 185, 0.76)",
    border: "rgba(63, 121, 139, 0.34)",
  },
  product: {
    soft: "rgba(159, 109, 196, 0.18)",
    strong: "rgba(159, 109, 196, 0.78)",
    border: "rgba(117, 76, 150, 0.34)",
  },
  general: {
    soft: "rgba(117, 150, 139, 0.18)",
    strong: "rgba(117, 150, 139, 0.76)",
    border: "rgba(80, 112, 100, 0.34)",
  },
};

const EVENT_TYPE_FALLBACK_PALETTE = [
  {
    soft: "rgba(210, 117, 92, 0.18)",
    strong: "rgba(210, 117, 92, 0.76)",
    border: "rgba(175, 87, 64, 0.34)",
  },
  {
    soft: "rgba(90, 150, 142, 0.18)",
    strong: "rgba(90, 150, 142, 0.76)",
    border: "rgba(62, 117, 109, 0.34)",
  },
  {
    soft: "rgba(108, 132, 203, 0.18)",
    strong: "rgba(108, 132, 203, 0.78)",
    border: "rgba(80, 102, 171, 0.34)",
  },
  {
    soft: "rgba(187, 146, 82, 0.18)",
    strong: "rgba(187, 146, 82, 0.76)",
    border: "rgba(147, 112, 55, 0.34)",
  },
  {
    soft: "rgba(147, 113, 182, 0.18)",
    strong: "rgba(147, 113, 182, 0.78)",
    border: "rgba(111, 82, 145, 0.34)",
  },
  {
    soft: "rgba(89, 164, 115, 0.18)",
    strong: "rgba(89, 164, 115, 0.76)",
    border: "rgba(61, 126, 85, 0.34)",
  },
  {
    soft: "rgba(191, 122, 150, 0.18)",
    strong: "rgba(191, 122, 150, 0.76)",
    border: "rgba(151, 89, 116, 0.34)",
  },
  {
    soft: "rgba(92, 153, 188, 0.18)",
    strong: "rgba(92, 153, 188, 0.76)",
    border: "rgba(64, 117, 149, 0.34)",
  },
];

const elements = {
  appTitle: document.getElementById("app-title"),
  appSubtitle: document.getElementById("app-subtitle"),
  themeToggle: document.getElementById("theme-toggle"),
  statusBanner: document.getElementById("status-banner"),
  calendarContainer: document.getElementById("calendar-container"),
  upcomingList: document.getElementById("upcoming-list"),
  eventCount: document.getElementById("event-count"),
  reminderCount: document.getElementById("reminder-count"),
  weekCount: document.getElementById("week-count"),
  activeCount: document.getElementById("active-count"),
  jumpToday: document.getElementById("jump-today"),
  refreshData: document.getElementById("refresh-data"),
  addEvent: document.getElementById("add-event"),
  addReminder: document.getElementById("add-reminder"),
  publishChanges: document.getElementById("publish-changes"),
  configureGithub: document.getElementById("configure-github"),
  syncHeadline: document.getElementById("sync-headline"),
  syncBody: document.getElementById("sync-body"),
  dataSourceLabel: document.getElementById("data-source-label"),
  pendingCount: document.getElementById("pending-count"),
  editorModal: document.getElementById("editor-modal"),
  editorTitle: document.getElementById("editor-title"),
  editorKind: document.getElementById("editor-kind"),
  editorFields: document.getElementById("editor-fields"),
  editorNote: document.getElementById("editor-note"),
  editorForm: document.getElementById("editor-form"),
  deleteItem: document.getElementById("delete-item"),
  cancelEditor: document.getElementById("cancel-editor"),
  cancelEditorSecondary: document.getElementById("cancel-editor-secondary"),
  settingsModal: document.getElementById("settings-modal"),
  settingsForm: document.getElementById("settings-form"),
  closeSettings: document.getElementById("close-settings"),
  closeSettingsSecondary: document.getElementById("close-settings-secondary"),
};

const state = {
  data: createEmptyCalendarData(),
  sourceLabel: "JSON",
  dirty: false,
  syncPending: false,
  lastLoadedAt: null,
  editorContext: null,
  githubSettings: mergeGithubSettings(loadStoredGithubSettings()),
};

initialize();

function initialize() {
  elements.appTitle.textContent = APP_CONFIG.appTitle;
  elements.appSubtitle.textContent = APP_CONFIG.subtitle;
  document.documentElement.style.setProperty("--menubar-space", `${APP_CONFIG.menuBarHeight}px`);
  document.documentElement.style.setProperty("--desktop-width", APP_CONFIG.viewportWidth);
  document.documentElement.style.setProperty("--desktop-height", APP_CONFIG.viewportHeight);

  applyTheme(getInitialTheme());
  bindEvents();
  populateSettingsForm();
  renderSyncCard();
  loadAndRender();
}

function bindEvents() {
  elements.jumpToday.addEventListener("click", () => {
    const currentMonthCard = elements.calendarContainer.querySelector("[data-current-month='true']");
    if (currentMonthCard) {
      currentMonthCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  elements.refreshData.addEventListener("click", async () => {
    if (state.dirty && !window.confirm("Discard local draft changes and reload repository data?")) {
      return;
    }
    clearDraft();
    await loadAndRender({ forceRemote: true });
  });

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });

  elements.addEvent.addEventListener("click", () => openEditor("event"));
  elements.addReminder.addEventListener("click", () => openEditor("reminder"));
  elements.publishChanges.addEventListener("click", () => publishChanges());
  elements.configureGithub.addEventListener("click", () => openSettingsModal());

  elements.editorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEditorItem();
  });

  elements.deleteItem.addEventListener("click", () => deleteEditorItem());
  elements.cancelEditor.addEventListener("click", () => closeModal(elements.editorModal));
  elements.cancelEditorSecondary.addEventListener("click", () => closeModal(elements.editorModal));

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveGithubSettings();
  });

  elements.closeSettings.addEventListener("click", () => closeModal(elements.settingsModal));
  elements.closeSettingsSecondary.addEventListener("click", () => closeModal(elements.settingsModal));
}

async function loadAndRender(options = {}) {
  setStatus("Loading calendar data...");

  try {
    const remoteData = await loadRepositoryData();
    const draftData = options.forceRemote ? null : loadDraft();
    state.data = draftData ? normalizeCalendarData(draftData) : remoteData;
    state.dirty = Boolean(draftData);
    state.lastLoadedAt = new Date();

    renderAll();

    if (draftData) {
      setStatus("Loaded local draft changes. Publish when you are ready.");
    } else {
      hideStatus();
    }
  } catch (error) {
    console.error(error);
    state.data = createEmptyCalendarData();
    state.dirty = false;
    renderAll();
    elements.calendarContainer.innerHTML = `
      <div class="status-banner">
        The page could not load the repository data. If you opened this file directly, serve it through a local or GitHub Pages web server instead.
      </div>
    `;
    setStatus("Unable to load calendar data.");
  }
}

async function loadRepositoryData() {
  const calendarPath = APP_CONFIG.dataSources.calendar || DEFAULT_DATA_PATH;
  const jsonResponse = await fetch(calendarPath, { cache: "no-store" });

  if (jsonResponse.ok) {
    const rawData = await jsonResponse.json();
    state.sourceLabel = "JSON";
    return normalizeCalendarData(rawData);
  }

  if (jsonResponse.status && jsonResponse.status !== 404) {
    throw new Error(`Failed to load ${calendarPath}: ${jsonResponse.status}`);
  }

  const [eventRows, reminderRows] = await Promise.all([
    loadCsv(APP_CONFIG.dataSources.events),
    loadCsv(APP_CONFIG.dataSources.reminders),
  ]);

  state.sourceLabel = "CSV fallback";
  return normalizeCalendarData({
    version: 1,
    updatedAt: new Date().toISOString(),
    events: eventRows,
    reminders: reminderRows,
  });
}

async function loadCsv(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  const csv = await response.text();
  return parseCsv(csv);
}

function parseCsv(csvText) {
  const input = csvText.replace(/^\uFEFF/, "").trim();
  if (!input) {
    return [];
  }

  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) => normalizeHeader(header));
  return rows.slice(1).filter(hasValues).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = (values[index] || "").trim();
      }
    });
    return record;
  });
}

function normalizeCalendarData(rawData) {
  const events = Array.isArray(rawData?.events) ? rawData.events : [];
  const reminders = Array.isArray(rawData?.reminders) ? rawData.reminders : [];

  return {
    version: Number(rawData?.version) || 1,
    updatedAt: rawData?.updatedAt || new Date().toISOString(),
    events: events.map((entry, index) => normalizeEvent(entry, index)).filter(Boolean).sort(byDate("deadline")),
    reminders: reminders.map((entry, index) => normalizeReminder(entry, index)).filter(Boolean).sort(byDate("time")),
  };
}

function normalizeEvent(row, index = 0) {
  const title = getValue(row, ["title", "name", "event", "summary"]);
  const deadline = parseDateValue(getValue(row, ["deadline", "due", "date", "datetime"]));
  if (!title || !deadline) {
    return null;
  }

  const parsedStartDate = parseDateValue(getValue(row, ["startDate", "start_date", "start", "begin"]));
  const startDate = parsedStartDate && parsedStartDate <= deadline
    ? parsedStartDate
    : startOfDay(new Date());
  const eventType = getValue(row, ["eventType", "event_type", "type", "category"]) || "General";

  return {
    id: getValue(row, ["id"]) || createItemId("event", title, deadline, index),
    kind: "event",
    title,
    startDate,
    deadline,
    eventType,
    eventTypeKey: normalizeTypeKey(eventType),
    address: getValue(row, ["address", "location", "place"]) || "Not set",
    details: getValue(row, ["details", "description", "notes"]) || "",
    extra: normalizeExtraField(row?.extra) || collectExtra(row, [
      "id",
      "title",
      "name",
      "event",
      "summary",
      "startDate",
      "start_date",
      "start",
      "begin",
      "deadline",
      "due",
      "date",
      "datetime",
      "eventType",
      "event_type",
      "type",
      "category",
      "address",
      "location",
      "place",
      "details",
      "description",
      "notes",
      "extra",
    ]),
  };
}

function normalizeReminder(row, index = 0) {
  const message = getValue(row, ["message", "title", "summary", "reminder"]);
  const time = parseDateValue(getValue(row, ["time", "datetime", "date"]));
  if (!message || !time) {
    return null;
  }

  return {
    id: getValue(row, ["id"]) || createItemId("reminder", message, time, index),
    kind: "reminder",
    message,
    time,
    extra: normalizeExtraField(row?.extra) || collectExtra(row, [
      "id",
      "message",
      "title",
      "summary",
      "reminder",
      "time",
      "datetime",
      "date",
      "extra",
    ]),
  };
}

function getValue(row, keys) {
  if (!row || typeof row !== "object") {
    return "";
  }

  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return "";
}

function normalizeExtraField(extra) {
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
    return null;
  }

  return Object.entries(extra).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null || value === "") {
      return accumulator;
    }
    accumulator[key] = String(value);
    return accumulator;
  }, {});
}

function collectExtra(row, knownKeys) {
  if (!row || typeof row !== "object") {
    return {};
  }

  const lowerKnown = new Set(knownKeys.map((key) => key.toLowerCase()));
  return Object.entries(row).reduce((accumulator, [key, value]) => {
    if (!lowerKnown.has(key.toLowerCase()) && value !== undefined && value !== null && value !== "") {
      accumulator[key] = String(value);
    }
    return accumulator;
  }, {});
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const dateOnly = new Date(`${value}T00:00`);
  if (!Number.isNaN(dateOnly.getTime())) {
    return dateOnly;
  }

  return null;
}

function byDate(key) {
  return (left, right) => left[key] - right[key];
}

function renderAll() {
  renderStats();
  renderUpcoming();
  renderCalendar();
  renderSyncCard();
}

function renderStats() {
  const now = startOfDay(new Date());
  const weekFromNow = addDays(now, 7);
  const activeEvents = state.data.events.filter((event) => startOfDay(event.deadline) >= now);
  const thisWeek = [
    ...state.data.events.filter((event) => startOfDay(event.deadline) >= now && startOfDay(event.deadline) < weekFromNow),
    ...state.data.reminders.filter((reminder) => startOfDay(reminder.time) >= now && startOfDay(reminder.time) < weekFromNow),
  ];

  elements.eventCount.textContent = String(state.data.events.length);
  elements.reminderCount.textContent = String(state.data.reminders.length);
  elements.weekCount.textContent = String(thisWeek.length);
  elements.activeCount.textContent = String(activeEvents.length);
}

function renderUpcoming() {
  const now = startOfDay(new Date());
  const end = addDays(now, APP_CONFIG.upcomingDays);
  const upcoming = [
    ...state.data.events
      .filter((event) => startOfDay(event.deadline) >= now && startOfDay(event.deadline) < end)
      .map((event) => ({
        kind: "event",
        title: event.title,
        when: event.deadline,
        item: event,
        meta: `${event.eventType} · ${event.address}`,
      })),
    ...state.data.reminders
      .filter((reminder) => startOfDay(reminder.time) >= now && startOfDay(reminder.time) < end)
      .map((reminder) => ({
        kind: "reminder",
        title: reminder.message,
        when: reminder.time,
        item: reminder,
        meta: "Reminder",
      })),
  ].sort((left, right) => left.when - right.when);

  if (!upcoming.length) {
    elements.upcomingList.innerHTML = `
      <div class="empty-state">
        Nothing is scheduled in the next ${APP_CONFIG.upcomingDays} days yet.
      </div>
    `;
    return;
  }

  elements.upcomingList.innerHTML = "";
  upcoming.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "upcoming-item";
    button.innerHTML = `
      <span class="upcoming-item__title">${escapeHtml(entry.title)}</span>
      <span class="upcoming-item__meta">${formatDateTime(entry.when)} · ${escapeHtml(entry.meta)}</span>
    `;
    button.addEventListener("click", () => openEditor(entry.kind, entry.item.id));
    elements.upcomingList.appendChild(button);
  });
}

function renderCalendar() {
  const today = startOfDay(new Date());
  const monthStarts = Array.from({ length: APP_CONFIG.monthsToRender }, (_, index) =>
    startOfMonth(addMonths(today, index)),
  );

  elements.calendarContainer.innerHTML = "";

  monthStarts.forEach((monthStart) => {
    const monthCard = document.createElement("section");
    monthCard.className = "month-card";
    monthCard.dataset.currentMonth = compareDays(monthStart, startOfMonth(today)) ? "true" : "false";

    const monthGrid = buildMonthGrid(monthStart);
    const monthWeeks = chunk(monthGrid, 7);
    const eventLayout = buildEventLaneLayout(monthGrid);
    monthCard.innerHTML = `
      <div class="month-card__header">
        <div>
          <h3 class="month-card__title">${MONTH_FORMATTER.format(monthStart)}</h3>
          <p class="month-card__meta">${countItemsInMonth(monthStart)} scheduled items</p>
        </div>
        <div class="month-card__hint">Scroll to switch months</div>
      </div>
      <div class="weekday-row">${WEEKDAYS.map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="month-weeks"></div>
    `;

    const weeksContainer = monthCard.querySelector(".month-weeks");
    monthWeeks.forEach((weekDates, weekIndex) => {
      weeksContainer.appendChild(renderWeekRow(weekDates, monthStart, eventLayout, weekIndex));
    });

    elements.calendarContainer.appendChild(monthCard);
  });

  const currentMonthCard = elements.calendarContainer.querySelector("[data-current-month='true']");
  if (currentMonthCard) {
    currentMonthCard.scrollIntoView({ block: "start" });
  }
}

function renderWeekRow(weekDates, monthStart, eventLayout, weekIndex) {
  const week = document.createElement("section");
  week.className = "month-week";
  week.innerHTML = `<div class="week-grid"></div>`;

  const grid = week.querySelector(".week-grid");
  const segments = eventLayout.segmentsByWeek[weekIndex] || [];
  const visibleCounts = eventLayout.visibleCountByWeekDay[weekIndex] || Array(7).fill(0);

  weekDates.forEach((date, dayIndex) => {
    grid.appendChild(renderDayCard(date, monthStart, visibleCounts[dayIndex] || 0, dayIndex));
  });

  segments.forEach((segment) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `event-span event-span--rail${segment.showLabel ? "" : " is-quiet"}`;
    button.style.gridColumn = `${segment.startColumn} / ${segment.endColumn}`;
    button.style.gridRow = String(MAX_EVENT_LANES - segment.lane + 1);
    button.style.setProperty("--event-soft", segment.color.soft);
    button.style.setProperty("--event-strong", segment.color.strong);
    button.style.setProperty("--event-border", segment.color.border);
    button.innerHTML = `
      <span class="event-span__fill"></span>
      <span class="event-span__text">${escapeHtml(segment.label)}</span>
    `;
    button.title = `${segment.event.title} · due ${formatDateTime(segment.event.deadline)}`;
    button.addEventListener("click", () => openEditor("event", segment.event.id));
    grid.appendChild(button);
  });

  return week;
}

function buildMonthGrid(monthStart) {
  const firstGridDate = addDays(monthStart, -monthStart.getDay());
  const cells = [];
  for (let offset = 0; offset < 42; offset += 1) {
    cells.push(addDays(firstGridDate, offset));
  }
  return cells;
}

function buildEventLaneLayout(monthGrid) {
  const today = startOfDay(new Date());
  const visibleMonthStart = monthGrid[0];
  const visibleMonthEnd = monthGrid[monthGrid.length - 1];
  const laneEndIndexes = [];

  const visibleEvents = state.data.events
    .map((event) => {
      const effectiveStart = maxDate(startOfDay(event.startDate || today), today);
      const effectiveEnd = startOfDay(event.deadline);
      if (effectiveEnd < visibleMonthStart || effectiveStart > visibleMonthEnd) {
        return null;
      }

      const visibleStart = maxDate(effectiveStart, visibleMonthStart);
      const visibleEnd = minDate(effectiveEnd, visibleMonthEnd);
      const startIndex = dateIndexInGrid(monthGrid, visibleStart);
      const endIndex = dateIndexInGrid(monthGrid, visibleEnd);
      if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        return null;
      }

      return {
        event,
        startIndex,
        endIndex,
        color: getEventTypeColor(event.eventTypeKey),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.startIndex - right.startIndex || left.endIndex - right.endIndex);

  visibleEvents.forEach((entry) => {
    let lane = laneEndIndexes.findIndex((laneEnd) => laneEnd < entry.startIndex);
    if (lane === -1) {
      lane = laneEndIndexes.length;
      laneEndIndexes.push(entry.endIndex);
    } else {
      laneEndIndexes[lane] = entry.endIndex;
    }
    entry.lane = lane;
  });

  const segmentsByWeek = Array.from({ length: 6 }, () => []);
  const visibleCountByWeekDay = Array.from({ length: 6 }, () => Array(7).fill(0));

  visibleEvents.forEach((entry) => {
    const startWeek = Math.floor(entry.startIndex / 7);
    const endWeek = Math.floor(entry.endIndex / 7);

    if (entry.lane >= MAX_EVENT_LANES) {
      return;
    }

    for (let dayIndex = entry.startIndex; dayIndex <= entry.endIndex; dayIndex += 1) {
      const weekIndex = Math.floor(dayIndex / 7);
      const dayOffset = dayIndex % 7;
      visibleCountByWeekDay[weekIndex][dayOffset] = Math.max(
        visibleCountByWeekDay[weekIndex][dayOffset],
        entry.lane + 1,
      );
    }

    for (let weekIndex = startWeek; weekIndex <= endWeek; weekIndex += 1) {
      const weekStartIndex = weekIndex * 7;
      const weekEndIndex = weekStartIndex + 6;
      const segmentStart = Math.max(entry.startIndex, weekStartIndex);
      const segmentEnd = Math.min(entry.endIndex, weekEndIndex);
      const shouldLabelSegment = segmentStart === entry.startIndex || segmentEnd === entry.endIndex;

      segmentsByWeek[weekIndex].push({
        event: entry.event,
        lane: entry.lane,
        startColumn: segmentStart - weekStartIndex + 1,
        endColumn: segmentEnd - weekStartIndex + 2,
        isEnd: segmentEnd === entry.endIndex,
        showLabel: shouldLabelSegment,
        label: shouldLabelSegment ? entry.event.title : "",
        color: entry.color,
      });
    }
  });

  return {
    segmentsByWeek,
    visibleCountByWeekDay,
  };
}

function renderDayCard(date, monthStart, visibleEventCount, dayIndex) {
  const today = startOfDay(new Date());
  const cellDate = startOfDay(date);
  const inMonth = cellDate.getMonth() === monthStart.getMonth();
  const isToday = compareDays(cellDate, today);

  const reminders = getRemindersForDate(cellDate);

  const card = document.createElement("article");
  card.className = `day-card${inMonth ? "" : " is-muted"}${isToday ? " is-today" : ""}${visibleEventCount ? " has-events" : ""}`;
  card.dataset.today = isToday ? "true" : "false";
  card.style.gridColumn = String(dayIndex + 1);
  const clampedVisibleEventCount = Math.min(Math.max(visibleEventCount, 0), MAX_EVENT_LANES);
  card.style.gridRow = `1 / ${MAX_EVENT_LANES - clampedVisibleEventCount + 2}`;
  card.innerHTML = `
    <div class="day-card__top">
      <div class="day-card__headline">
        <span class="day-card__date">${cellDate.getDate()}</span>
        <div class="day-card__dots"></div>
      </div>
    </div>
  `;

  const dots = card.querySelector(".day-card__dots");

  reminders.forEach((reminder) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reminder-dot";
    button.title = `${reminder.message} · ${formatDateTime(reminder.time)}`;
    button.setAttribute("aria-label", `${reminder.message} at ${formatDateTime(reminder.time)}`);
    button.addEventListener("click", () => openEditor("reminder", reminder.id));
    dots.appendChild(button);
  });

  return card;
}

function getRemindersForDate(date) {
  return state.data.reminders.filter((reminder) => compareDays(startOfDay(reminder.time), date));
}

function countItemsInMonth(monthStart) {
  const monthEnd = endOfMonth(monthStart);
  const eventCount = state.data.events.filter((event) => startOfDay(event.startDate) <= monthEnd && startOfDay(event.deadline) >= monthStart).length;
  const reminderCount = state.data.reminders.filter((reminder) => reminder.time >= monthStart && reminder.time <= monthEnd).length;
  return eventCount + reminderCount;
}

function renderSyncCard() {
  const configured = Boolean(
    state.githubSettings.owner
    && state.githubSettings.repo
    && state.githubSettings.branch
    && state.githubSettings.token,
  );
  const modeLabel = state.githubSettings.commitMode === "contents" ? "GitHub contents API" : "GitHub Actions";
  const pendingLabel = state.dirty ? "Local draft pending" : "Working tree clean";
  const repositoryUrl = configured
    ? `https://github.com/${state.githubSettings.owner}/${state.githubSettings.repo}`
    : "";

  elements.syncHeadline.textContent = configured
    ? `${modeLabel} is ready`
    : "Read-only mode";
  elements.syncBody.innerHTML = configured
    ? `OpenCalendar sync targets <a class="sync-card__link" href="${escapeHtml(repositoryUrl)}" target="_blank" rel="noreferrer">${escapeHtml(state.githubSettings.repo)}</a>.`
    : "Add your repository owner, repo, branch, and a token in GitHub settings before publishing.";
  elements.dataSourceLabel.textContent = `Source: ${state.sourceLabel}`;
  elements.pendingCount.textContent = pendingLabel;
  elements.publishChanges.disabled = state.syncPending;
}

function openEditor(kind, itemId = null) {
  const item = itemId ? findItem(kind, itemId) : null;
  state.editorContext = {
    kind,
    itemId,
    mode: item ? "edit" : "create",
  };

  elements.editorKind.textContent = kind === "event" ? "Event" : "Reminder";
  elements.editorTitle.textContent = item
    ? kind === "event" ? item.title : item.message
    : kind === "event" ? "New event" : "New reminder";
  elements.editorFields.innerHTML = buildEditorFields(kind, item);
  elements.editorNote.textContent = state.dirty
    ? "This item will stay in your local draft until you publish to GitHub."
    : "Saving here updates the local draft first. Publish when you want to commit the JSON file.";
  elements.deleteItem.hidden = !item;

  openModal(elements.editorModal);
}

function buildEditorFields(kind, item) {
  if (kind === "event") {
    return `
      ${buildField("Title", "title", "text", item?.title || "", { required: true, full: true })}
      ${buildField("Start", "startDate", "datetime-local", toDateTimeLocalValue(item?.startDate || new Date()), { required: true })}
      ${buildField("Deadline", "deadline", "datetime-local", toDateTimeLocalValue(item?.deadline || addDays(new Date(), 1)), { required: true })}
      ${buildField("Event type", "eventType", "text", item?.eventType || "General", { required: true })}
      ${buildField("Address", "address", "text", item?.address === "Not set" ? "" : item?.address || "", {})}
      ${buildTextarea("Details", "details", item?.details || "", { full: true })}
    `;
  }

  return `
    ${buildField("Message", "message", "text", item?.message || "", { required: true, full: true })}
    ${buildField("Time", "time", "datetime-local", toDateTimeLocalValue(item?.time || new Date()), { required: true })}
  `;
}

function buildField(label, name, type, value, options = {}) {
  const required = options.required ? "required" : "";
  const full = options.full ? " form-field--full" : "";
  return `
    <label class="form-field${full}">
      <span class="form-field__label">${escapeHtml(label)}</span>
      <input type="${type}" name="${name}" value="${escapeHtml(String(value || ""))}" ${required} />
    </label>
  `;
}

function buildTextarea(label, name, value, options = {}) {
  const full = options.full ? " form-field--full" : "";
  return `
    <label class="form-field${full}">
      <span class="form-field__label">${escapeHtml(label)}</span>
      <textarea name="${name}" rows="4">${escapeHtml(String(value || ""))}</textarea>
    </label>
  `;
}

function saveEditorItem() {
  if (!state.editorContext) {
    return;
  }

  const formData = new FormData(elements.editorForm);
  const kind = state.editorContext.kind;
  const existing = state.editorContext.itemId ? findItem(kind, state.editorContext.itemId) : null;

  if (kind === "event") {
    const startDate = parseDateValue(formData.get("startDate"));
    const deadline = parseDateValue(formData.get("deadline"));
    if (!startDate || !deadline || deadline < startDate) {
      setStatus("Deadline must be after the event start time.");
      return;
    }

    const event = {
      id: existing?.id || createItemId("event", formData.get("title"), deadline, state.data.events.length),
      kind: "event",
      title: String(formData.get("title") || "").trim(),
      startDate,
      deadline,
      eventType: String(formData.get("eventType") || "General").trim() || "General",
      eventTypeKey: normalizeTypeKey(String(formData.get("eventType") || "General")),
      address: String(formData.get("address") || "").trim() || "Not set",
      details: String(formData.get("details") || "").trim(),
      extra: existing?.extra || {},
    };

    if (!event.title) {
      setStatus("Event title is required.");
      return;
    }

    upsertItem("events", event);
  } else {
    const time = parseDateValue(formData.get("time"));
    if (!time) {
      setStatus("Reminder time is required.");
      return;
    }

    const reminder = {
      id: existing?.id || createItemId("reminder", formData.get("message"), time, state.data.reminders.length),
      kind: "reminder",
      message: String(formData.get("message") || "").trim(),
      time,
      extra: existing?.extra || {},
    };

    if (!reminder.message) {
      setStatus("Reminder message is required.");
      return;
    }

    upsertItem("reminders", reminder);
  }

  persistDraft();
  renderAll();
  closeModal(elements.editorModal);
  setStatus("Saved to local draft. Publish to push the JSON update to GitHub.");
}

function deleteEditorItem() {
  if (!state.editorContext?.itemId) {
    return;
  }

  const collectionKey = state.editorContext.kind === "event" ? "events" : "reminders";
  const label = state.editorContext.kind === "event" ? "event" : "reminder";
  if (!window.confirm(`Delete this ${label} from the local draft?`)) {
    return;
  }

  state.data[collectionKey] = state.data[collectionKey].filter((item) => item.id !== state.editorContext.itemId);
  persistDraft();
  renderAll();
  closeModal(elements.editorModal);
  setStatus("Removed from the local draft. Publish to sync the deletion to GitHub.");
}

function upsertItem(collectionKey, item) {
  const collection = state.data[collectionKey];
  const existingIndex = collection.findIndex((entry) => entry.id === item.id);

  if (existingIndex === -1) {
    collection.push(item);
  } else {
    collection.splice(existingIndex, 1, item);
  }

  collection.sort(byDate(collectionKey === "events" ? "deadline" : "time"));
}

function findItem(kind, itemId) {
  const collection = kind === "event" ? state.data.events : state.data.reminders;
  return collection.find((item) => item.id === itemId) || null;
}

function openSettingsModal() {
  populateSettingsForm();
  openModal(elements.settingsModal);
}

function populateSettingsForm() {
  const form = elements.settingsForm;
  form.elements.owner.value = state.githubSettings.owner;
  form.elements.repo.value = state.githubSettings.repo;
  form.elements.branch.value = state.githubSettings.branch;
  form.elements.dataPath.value = state.githubSettings.dataPath;
  form.elements.commitMode.value = state.githubSettings.commitMode;
  form.elements.dispatchEventType.value = state.githubSettings.dispatchEventType;
  form.elements.token.value = state.githubSettings.token;
}

function saveGithubSettings() {
  const formData = new FormData(elements.settingsForm);
  state.githubSettings = mergeGithubSettings({
    owner: String(formData.get("owner") || "").trim(),
    repo: String(formData.get("repo") || "").trim(),
    branch: String(formData.get("branch") || "main").trim() || "main",
    dataPath: String(formData.get("dataPath") || "database/calendar-data.json").trim() || "database/calendar-data.json",
    commitMode: String(formData.get("commitMode") || "actions"),
    dispatchEventType: String(formData.get("dispatchEventType") || DEFAULT_DISPATCH_EVENT).trim() || DEFAULT_DISPATCH_EVENT,
    token: String(formData.get("token") || "").trim(),
  });

  window.localStorage.setItem(GITHUB_SETTINGS_STORAGE_KEY, JSON.stringify(state.githubSettings));
  renderSyncCard();
  closeModal(elements.settingsModal);
  setStatus("GitHub settings saved in this browser.");
}

async function publishChanges() {
  if (state.syncPending) {
    return;
  }

  if (!state.dirty) {
    setStatus("No local draft changes to publish.");
    return;
  }

  const missingSettings = getMissingGithubSettings();
  if (missingSettings.length) {
    setStatus(`GitHub settings missing: ${missingSettings.join(", ")}.`);
    openSettingsModal();
    return;
  }

  state.data.updatedAt = new Date().toISOString();
  const payload = serializeCalendarData(state.data);
  const commitMessage = buildCommitMessage();

  state.syncPending = true;
  renderSyncCard();
  setStatus(
    state.githubSettings.commitMode === "contents"
      ? "Publishing JSON through the GitHub contents API..."
      : "Triggering GitHub Actions to commit the JSON update...",
  );

  try {
    if (state.githubSettings.commitMode === "contents") {
      await publishViaContentsApi(payload, commitMessage);
    } else {
      await publishViaActions(payload, commitMessage);
    }

    clearDraft();
    renderAll();
    setStatus("Publish request completed. GitHub now has the latest JSON payload.");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "GitHub publish failed.");
  } finally {
    state.syncPending = false;
    renderSyncCard();
  }
}

async function publishViaActions(payload, commitMessage) {
  const response = await githubApi(
    `/repos/${state.githubSettings.owner}/${state.githubSettings.repo}/dispatches`,
    {
      method: "POST",
      body: JSON.stringify({
        event_type: state.githubSettings.dispatchEventType,
        client_payload: {
          data: payload,
          path: state.githubSettings.dataPath,
          branch: state.githubSettings.branch,
          commit_message: commitMessage,
        },
      }),
    },
  );

  if (response.status !== 204) {
    const body = await safeReadJson(response);
    throw new Error(body?.message || `Failed to trigger GitHub Actions: ${response.status}`);
  }
}

async function publishViaContentsApi(payload, commitMessage) {
  const encodedPath = encodeURIComponent(state.githubSettings.dataPath).replace(/%2F/g, "/");
  const existingResponse = await githubApi(
    `/repos/${state.githubSettings.owner}/${state.githubSettings.repo}/contents/${encodedPath}?ref=${encodeURIComponent(state.githubSettings.branch)}`,
    { method: "GET" },
  );

  let sha = null;
  if (existingResponse.status === 200) {
    const existing = await existingResponse.json();
    sha = existing.sha || null;
  } else if (existingResponse.status !== 404) {
    const body = await safeReadJson(existingResponse);
    throw new Error(body?.message || `Failed to read current file: ${existingResponse.status}`);
  }

  const updateResponse = await githubApi(
    `/repos/${state.githubSettings.owner}/${state.githubSettings.repo}/contents/${encodedPath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: commitMessage,
        content: payload,
        branch: state.githubSettings.branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );

  if (!updateResponse.ok) {
    const body = await safeReadJson(updateResponse);
    throw new Error(body?.message || `Failed to update repository file: ${updateResponse.status}`);
  }
}

function githubApi(path, options = {}) {
  return fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${state.githubSettings.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
    body: options.body,
  });
}

function getMissingGithubSettings() {
  const missing = [];
  if (!state.githubSettings.owner) {
    missing.push("owner");
  }
  if (!state.githubSettings.repo) {
    missing.push("repo");
  }
  if (!state.githubSettings.branch) {
    missing.push("branch");
  }
  if (!state.githubSettings.dataPath) {
    missing.push("data path");
  }
  if (!state.githubSettings.token) {
    missing.push("token");
  }
  if (state.githubSettings.commitMode === "actions" && !state.githubSettings.dispatchEventType) {
    missing.push("dispatch event type");
  }
  return missing;
}

function loadStoredGithubSettings() {
  try {
    const raw = window.localStorage.getItem(GITHUB_SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

function mergeGithubSettings(storedSettings) {
  return {
    ...APP_CONFIG.github,
    ...(storedSettings || {}),
  };
}

function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function persistDraft() {
  state.dirty = true;
  state.data.updatedAt = new Date().toISOString();
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toPlainCalendarData(state.data)));
}

function clearDraft() {
  state.dirty = false;
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

function serializeCalendarData(data) {
  return window.btoa(unescape(encodeURIComponent(JSON.stringify(toPlainCalendarData(data), null, 2))));
}

function toPlainCalendarData(data) {
  return {
    version: data.version || 1,
    updatedAt: data.updatedAt || new Date().toISOString(),
    events: data.events.map((event) => ({
      id: event.id,
      title: event.title,
      startDate: toIsoMinuteString(event.startDate),
      deadline: toIsoMinuteString(event.deadline),
      eventType: event.eventType,
      address: event.address,
      details: event.details,
      extra: event.extra || {},
    })),
    reminders: data.reminders.map((reminder) => ({
      id: reminder.id,
      message: reminder.message,
      time: toIsoMinuteString(reminder.time),
      extra: reminder.extra || {},
    })),
  };
}

function createEmptyCalendarData() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    events: [],
    reminders: [],
  };
}

function createItemId(prefix, label, date, index) {
  const normalizedLabel = String(label || prefix)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || prefix;
  const stamp = toIsoMinuteString(date).replace(/[^0-9]/g, "").slice(0, 12);
  return `${prefix}-${stamp}-${index + 1}-${normalizedLabel}`;
}

function buildCommitMessage() {
  const eventCount = state.data.events.length;
  const reminderCount = state.data.reminders.length;
  return `chore: sync calendar data (${eventCount} events, ${reminderCount} reminders)`;
}

function safeReadJson(response) {
  return response.json().catch(() => null);
}

function openModal(modal) {
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

function closeModal(modal) {
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

function normalizeHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hasValues(values) {
  return values.some((value) => value && value.trim());
}

function setStatus(message) {
  elements.statusBanner.textContent = message;
  elements.statusBanner.classList.remove("is-hidden");
}

function hideStatus() {
  elements.statusBanner.textContent = "";
  elements.statusBanner.classList.add("is-hidden");
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  elements.themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  elements.themeToggle.setAttribute("aria-pressed", String(isDark));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return startOfDay(result);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function compareDays(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatDateTime(date) {
  return DATETIME_FORMATTER.format(date);
}

function normalizeTypeKey(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "general";
}

function getEventTypeColor(typeKey) {
  if (EVENT_TYPE_COLORS[typeKey]) {
    return EVENT_TYPE_COLORS[typeKey];
  }

  const fallbackIndex = hashString(typeKey) % EVENT_TYPE_FALLBACK_PALETTE.length;
  return EVENT_TYPE_FALLBACK_PALETTE[fallbackIndex];
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function chunk(values, size) {
  const output = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

function dateIndexInGrid(monthGrid, targetDate) {
  return monthGrid.findIndex((date) => compareDays(date, targetDate));
}

function maxDate(...dates) {
  return dates.reduce((latest, current) => (current > latest ? current : latest));
}

function minDate(...dates) {
  return dates.reduce((earliest, current) => (current < earliest ? current : earliest));
}

function toDateTimeLocalValue(date) {
  if (!date) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoMinuteString(date) {
  const normalized = new Date(date);
  normalized.setSeconds(0, 0);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  const hours = String(normalized.getHours()).padStart(2, "0");
  const minutes = String(normalized.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
