import {
  APP_CONFIG,
  MAX_EVENT_LANES,
  MONTH_FORMATTER,
  WEEKDAYS,
} from "./config.mjs";
import {
  addDays,
  addMonths,
  chunk,
  compareDays,
  dateIndexInGrid,
  endOfMonth,
  escapeHtml,
  formatDateTime,
  getEventTypeColor,
  maxDate,
  minDate,
  pluralizeUnit,
  startOfDay,
  startOfMonth,
} from "./utils.mjs";

export function renderAll({ state, elements, openEditor }) {
  renderStats({ state, elements });
  renderUpcoming({ state, elements, openEditor });
  renderCalendar({ state, elements, openEditor });
  renderSyncCard({ state, elements });
}

export function renderSyncCard({ state, elements }) {
  const configured = Boolean(
    state.githubSettings.owner
      && state.githubSettings.repo
      && state.githubSettings.branch
      && state.githubSettings.token,
  );
  const modeLabel = state.githubSettings.commitMode === "contents"
    ? "GitHub contents API"
    : "GitHub Actions";
  const pendingLabel = state.dirty ? "Local draft pending" : "Working tree clean";
  const repositoryUrl = configured
    ? `https://github.com/${state.githubSettings.owner}/${state.githubSettings.repo}`
    : "";

  elements.syncHeadline.textContent = configured ? `${modeLabel} is ready` : "Read-only mode";
  elements.syncBody.innerHTML = configured
    ? `OpenCalendar sync targets <a class="sync-card__link" href="${escapeHtml(repositoryUrl)}" target="_blank" rel="noreferrer">${escapeHtml(state.githubSettings.repo)}</a>.`
    : "Add your repository owner, repo, branch, and a token in GitHub settings before publishing.";
  elements.dataSourceLabel.textContent = `Source: ${state.sourceLabel}`;
  elements.pendingCount.textContent = pendingLabel;
  elements.publishChanges.disabled = state.syncPending;
}

export function setStatus(elements, message) {
  elements.statusBanner.textContent = message;
  elements.statusBanner.classList.remove("is-hidden");
}

export function hideStatus(elements) {
  elements.statusBanner.textContent = "";
  elements.statusBanner.classList.add("is-hidden");
}

function renderStats({ state, elements }) {
  const now = startOfDay(new Date());
  const weekFromNow = addDays(now, 7);
  const reminders = state.data.reminders;
  const activeEvents = state.data.events.filter((event) => startOfDay(event.deadline) >= now);
  const dueThisWeek = [
    ...state.data.events.filter((event) => startOfDay(event.deadline) >= now && startOfDay(event.deadline) < weekFromNow),
    ...reminders.filter((reminder) => startOfDay(reminder.time) >= now && startOfDay(reminder.time) < weekFromNow),
  ];

  elements.eventCount.textContent = String(state.data.events.length);
  elements.reminderCount.textContent = String(reminders.length);
  elements.weekCount.textContent = String(dueThisWeek.length);
  elements.activeCount.textContent = String(activeEvents.length);
}

function renderUpcoming({ state, elements, openEditor }) {
  const now = startOfDay(new Date());
  const end = addDays(now, APP_CONFIG.upcomingDays);
  const upcoming = [
    ...state.data.events
      .filter((event) => startOfDay(event.deadline) >= now && startOfDay(event.deadline) < end)
      .map((event) => ({
        kind: "event",
        title: event.title,
        when: event.deadline,
        meta: `${event.completed ? "Completed · " : ""}${event.eventType} · ${event.address}`,
        id: event.id,
      })),
    ...state.data.reminders
      .filter((reminder) => startOfDay(reminder.time) >= now && startOfDay(reminder.time) < end)
      .map((reminder) => ({
        kind: "reminder",
        title: reminder.message,
        when: reminder.time,
        meta: buildReminderMeta(reminder),
        id: reminder.id,
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
    button.addEventListener("click", () => openEditor(entry.kind, entry.id));
    elements.upcomingList.appendChild(button);
  });
}

function buildReminderMeta(reminder) {
  const completedLabel = reminder.completed ? "Completed · " : "";
  if (reminder.recurring) {
    return `${completedLabel}Reminder · repeats every ${reminder.recurrenceInterval} ${pluralizeUnit(reminder.recurrenceUnit, reminder.recurrenceInterval)}`;
  }

  return `${completedLabel}Reminder`;
}

function renderCalendar({ state, elements, openEditor }) {
  const today = startOfDay(new Date());
  const monthStarts = Array.from(
    { length: APP_CONFIG.monthsToRender },
    (_, index) => startOfMonth(addMonths(today, index)),
  );

  elements.calendarContainer.innerHTML = "";

  monthStarts.forEach((monthStart) => {
    const monthCard = document.createElement("section");
    monthCard.className = "month-card";
    monthCard.dataset.currentMonth = compareDays(monthStart, startOfMonth(today)) ? "true" : "false";

    const monthGrid = buildMonthGrid(monthStart);
    const monthWeeks = chunk(monthGrid, 7);
    const eventLayout = buildEventLaneLayout(state, monthGrid);

    monthCard.innerHTML = `
      <div class="month-card__header">
        <div>
          <h3 class="month-card__title">${MONTH_FORMATTER.format(monthStart)}</h3>
          <p class="month-card__meta">${countItemsInMonth(state, monthStart)} scheduled items</p>
        </div>
        <div class="month-card__hint">Scroll to switch months</div>
      </div>
      <div class="weekday-row">${WEEKDAYS.map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="month-weeks"></div>
    `;

    const weeksContainer = monthCard.querySelector(".month-weeks");
    monthWeeks.forEach((weekDates, weekIndex) => {
      weeksContainer.appendChild(
        renderWeekRow({ state, weekDates, monthStart, weekIndex, eventLayout, openEditor }),
      );
    });

    elements.calendarContainer.appendChild(monthCard);
  });

  const currentMonthCard = elements.calendarContainer.querySelector("[data-current-month='true']");
  if (currentMonthCard) {
    currentMonthCard.scrollIntoView({ block: "start" });
  }
}

function renderWeekRow({ state, weekDates, monthStart, weekIndex, eventLayout, openEditor }) {
  const week = document.createElement("section");
  week.className = "month-week";
  week.innerHTML = `<div class="week-grid"></div>`;

  const grid = week.querySelector(".week-grid");
  const segments = eventLayout.segmentsByWeek[weekIndex] || [];
  const visibleCounts = eventLayout.visibleCountByWeekDay[weekIndex] || Array(7).fill(0);

  weekDates.forEach((date, dayIndex) => {
    grid.appendChild(
      renderDayCard({ state, date, monthStart, dayIndex, visibleEventCount: visibleCounts[dayIndex] || 0, openEditor }),
    );
  });

  segments.forEach((segment) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `event-span event-span--rail${segment.event.completed ? " is-completed" : ""}${segment.showLabel ? "" : " is-quiet"}`;
    button.style.gridColumn = `${segment.startColumn} / ${segment.endColumn}`;
    button.style.gridRow = String(MAX_EVENT_LANES - segment.lane + 1);
    button.style.setProperty("--event-soft", segment.color.soft);
    button.style.setProperty("--event-strong", segment.color.strong);
    button.style.setProperty("--event-border", segment.color.border);
    button.innerHTML = `
      <span class="event-span__fill"></span>
      <span class="event-span__text">${escapeHtml(segment.label)}</span>
    `;
    button.title = `${segment.event.title} · due ${formatDateTime(segment.event.deadline)}${segment.event.completed ? " · completed" : ""}`;
    button.addEventListener("click", () => openEditor("event", segment.event.id));
    grid.appendChild(button);
  });

  return week;
}

function buildMonthGrid(monthStart) {
  const firstGridDate = addDays(monthStart, -monthStart.getDay());
  return Array.from({ length: 42 }, (_, offset) => addDays(firstGridDate, offset));
}

function buildEventLaneLayout(state, monthGrid) {
  const today = startOfDay(new Date());
  const visibleMonthStart = monthGrid[0];
  const visibleMonthEnd = monthGrid[monthGrid.length - 1];
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

  assignEventLanesByNearestDeadline(visibleEvents);

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
      const showLabel = segmentStart === entry.startIndex || segmentEnd === entry.endIndex;

      segmentsByWeek[weekIndex].push({
        event: entry.event,
        lane: entry.lane,
        startColumn: segmentStart - weekStartIndex + 1,
        endColumn: segmentEnd - weekStartIndex + 2,
        showLabel,
        label: showLabel ? entry.event.title : "",
        color: entry.color,
      });
    }
  });

  return { segmentsByWeek, visibleCountByWeekDay };
}

function renderDayCard({ state, date, monthStart, dayIndex, visibleEventCount, openEditor }) {
  const today = startOfDay(new Date());
  const cellDate = startOfDay(date);
  const inMonth = cellDate.getMonth() === monthStart.getMonth();
  const isToday = compareDays(cellDate, today);
  const reminders = getRemindersForDate(state, cellDate);

  const card = document.createElement("article");
  card.className = `day-card${inMonth ? "" : " is-muted"}${isToday ? " is-today" : ""}${visibleEventCount ? " has-events" : ""}`;
  card.dataset.today = isToday ? "true" : "false";
  card.style.gridColumn = String(dayIndex + 1);
  card.style.gridRow = `1 / ${MAX_EVENT_LANES - Math.min(Math.max(visibleEventCount, 0), MAX_EVENT_LANES) + 2}`;
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
    button.className = `reminder-dot${reminder.completed ? " is-completed" : ""}`;
    button.title = `${reminder.message} · ${formatDateTime(reminder.time)}${reminder.completed ? " · completed" : ""}`;
    button.setAttribute("aria-label", `${reminder.message} at ${formatDateTime(reminder.time)}`);
    button.addEventListener("click", () => openEditor("reminder", reminder.id));
    dots.appendChild(button);
  });

  return card;
}

function getRemindersForDate(state, date) {
  return state.data.reminders.filter((reminder) => compareDays(startOfDay(reminder.time), date));
}

function countItemsInMonth(state, monthStart) {
  const monthEnd = endOfMonth(monthStart);
  const eventCount = state.data.events.filter(
    (event) => startOfDay(event.startDate) <= monthEnd && startOfDay(event.deadline) >= monthStart,
  ).length;
  const reminderCount = state.data.reminders.filter(
    (reminder) => reminder.time >= monthStart && reminder.time <= monthEnd,
  ).length;
  return eventCount + reminderCount;
}

function assignEventLanesByNearestDeadline(entries) {
  const activeLanes = Array(MAX_EVENT_LANES).fill(null);

  entries.forEach((entry) => {
    for (let laneIndex = 0; laneIndex < activeLanes.length; laneIndex += 1) {
      const activeEntry = activeLanes[laneIndex];
      if (activeEntry && activeEntry.endIndex < entry.startIndex) {
        activeLanes[laneIndex] = null;
      }
    }

    const freeLane = activeLanes.findIndex((laneEntry) => laneEntry === null);
    if (freeLane !== -1) {
      entry.lane = freeLane;
      activeLanes[freeLane] = entry;
      return;
    }

    const replaceableLane = activeLanes.reduce((selectedLane, activeEntry, laneIndex) => {
      if (!activeEntry || activeEntry.endIndex < entry.startIndex) {
        return selectedLane;
      }
      if (selectedLane === -1) {
        return laneIndex;
      }

      return activeEntry.endIndex > activeLanes[selectedLane].endIndex ? laneIndex : selectedLane;
    }, -1);

    if (replaceableLane === -1) {
      entry.lane = MAX_EVENT_LANES;
      return;
    }

    const replaceableEntry = activeLanes[replaceableLane];
    if (replaceableEntry && replaceableEntry.endIndex > entry.endIndex) {
      replaceableEntry.lane = MAX_EVENT_LANES;
      entry.lane = replaceableLane;
      activeLanes[replaceableLane] = entry;
      return;
    }

    entry.lane = MAX_EVENT_LANES;
  });
}
