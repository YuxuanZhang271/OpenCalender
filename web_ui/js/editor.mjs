import { DEFAULT_DISPATCH_EVENT, STORAGE_KEYS } from "./config.mjs";
import { mergeGithubSettings, persistDraft } from "./data.mjs";
import {
  addInterval,
  createItemId,
  escapeHtml,
  getDefaultEventDeadline,
  getDefaultReminderTime,
  normalizePositiveInteger,
  normalizeRecurrenceUnit,
  normalizeTypeKey,
  parseDateValue,
  toDateTimeLocalValue,
} from "./utils.mjs";

export function openEditor({ state, elements, kind, itemId, openModal }) {
  const item = itemId ? findItem(state, kind, itemId) : null;
  const defaultEventStart = !item && kind === "event" ? new Date() : null;
  const defaultReminderTime = !item && kind === "reminder" ? getDefaultReminderTime() : null;

  state.editorContext = {
    kind,
    itemId,
    mode: item ? "edit" : "create",
  };

  elements.editorKind.textContent = kind === "event" ? "Event" : "Reminder";
  elements.editorTitle.textContent = item
    ? kind === "event" ? item.title : item.message
    : kind === "event" ? "New event" : "New reminder";
  elements.editorFields.innerHTML = buildEditorFields(kind, item, {
    defaultEventStart,
    defaultReminderTime,
  });
  elements.editorNote.textContent = state.dirty
    ? "This item will stay in your local draft until you publish to GitHub."
    : "Saving here updates the local draft first. Publish when you want to commit the JSON file.";
  elements.deleteItem.hidden = !item;

  initializeEditorDefaults(elements, kind, item);
  openModal(elements.editorModal);
}

export function saveEditorItem({ state, elements, render, closeModal, setStatus }) {
  if (!state.editorContext) {
    return;
  }

  const formData = new FormData(elements.editorForm);
  const kind = state.editorContext.kind;
  const existing = state.editorContext.itemId
    ? findItem(state, kind, state.editorContext.itemId)
    : null;

  if (kind === "event") {
    const startDate = parseDateValue(formData.get("startDate"));
    const deadline = parseDateValue(formData.get("deadline"));
    const title = String(formData.get("title") || "").trim();
    const eventType = String(formData.get("eventType") || "General").trim() || "General";

    if (!title) {
      setStatus("Event title is required.");
      return;
    }

    if (!startDate || !deadline || deadline < startDate) {
      setStatus("Deadline must be after the event start time.");
      return;
    }

    upsertItem(state, "events", {
      id: existing?.id || createItemId("event", title, deadline, state.data.events.length),
      kind: "event",
      title,
      startDate,
      deadline,
      completed: formData.get("completed") === "on",
      eventType,
      eventTypeKey: normalizeTypeKey(eventType),
      address: String(formData.get("address") || "").trim() || "Not set",
      details: String(formData.get("details") || "").trim(),
      extra: existing?.extra || {},
    });
  } else {
    const time = parseDateValue(formData.get("time"));
    const message = String(formData.get("message") || "").trim();

    if (!message) {
      setStatus("Reminder message is required.");
      return;
    }

    if (!time) {
      setStatus("Reminder time is required.");
      return;
    }

    const recurring = formData.get("recurring") === "on";
    const completed = formData.get("completed") === "on";
    const recurrenceInterval = normalizePositiveInteger(formData.get("recurrenceInterval"), 1);
    const recurrenceUnit = normalizeRecurrenceUnit(String(formData.get("recurrenceUnit") || "day"));
    const completionTimestamp = new Date();
    const shouldAdvanceRecurring = recurring && completed;

    upsertItem(state, "reminders", {
      id: existing?.id || createItemId("reminder", message, time, state.data.reminders.length),
      kind: "reminder",
      message,
      time: shouldAdvanceRecurring
        ? addInterval(completionTimestamp, recurrenceInterval, recurrenceUnit)
        : time,
      completed: shouldAdvanceRecurring ? false : completed,
      completedAt: !recurring && completed ? completionTimestamp : null,
      recurring,
      recurrenceInterval: recurring ? recurrenceInterval : 1,
      recurrenceUnit,
      lastCompletedAt: shouldAdvanceRecurring ? completionTimestamp : existing?.lastCompletedAt || null,
      extra: existing?.extra || {},
    });
  }

  persistDraft(state);
  render();
  closeModal(elements.editorModal);

  if (kind === "reminder" && formData.get("recurring") === "on" && formData.get("completed") === "on") {
    setStatus("Recurring reminder completed and advanced to the next scheduled time in your local draft.");
    return;
  }

  setStatus("Saved to local draft. Publish to push the JSON update to GitHub.");
}

export function deleteEditorItem({ state, elements, render, closeModal, setStatus }) {
  if (!state.editorContext?.itemId) {
    return;
  }

  const collectionKey = state.editorContext.kind === "event" ? "events" : "reminders";
  const label = state.editorContext.kind === "event" ? "event" : "reminder";
  if (!window.confirm(`Delete this ${label} from the local draft?`)) {
    return;
  }

  state.data[collectionKey] = state.data[collectionKey].filter(
    (item) => item.id !== state.editorContext.itemId,
  );

  persistDraft(state);
  render();
  closeModal(elements.editorModal);
  setStatus("Removed from the local draft. Publish to sync the deletion to GitHub.");
}

export function openSettingsModal({ state, elements, openModal }) {
  populateSettingsForm({ state, elements });
  openModal(elements.settingsModal);
}

export function populateSettingsForm({ state, elements }) {
  const form = elements.settingsForm;
  form.elements.owner.value = state.githubSettings.owner;
  form.elements.repo.value = state.githubSettings.repo;
  form.elements.branch.value = state.githubSettings.branch;
  form.elements.dataPath.value = state.githubSettings.dataPath;
  form.elements.commitMode.value = state.githubSettings.commitMode;
  form.elements.dispatchEventType.value = state.githubSettings.dispatchEventType;
  form.elements.token.value = state.githubSettings.token;
}

export function saveGithubSettings({ state, elements, render, closeModal, setStatus }) {
  const formData = new FormData(elements.settingsForm);

  state.githubSettings = mergeGithubSettings({
    owner: String(formData.get("owner") || "").trim(),
    repo: String(formData.get("repo") || "").trim(),
    branch: String(formData.get("branch") || "main").trim() || "main",
    dataPath: String(formData.get("dataPath") || "database/calendar-data.json").trim() || "database/calendar-data.json",
    commitMode: String(formData.get("commitMode") || "actions").trim() || "actions",
    dispatchEventType: String(formData.get("dispatchEventType") || DEFAULT_DISPATCH_EVENT).trim() || DEFAULT_DISPATCH_EVENT,
    token: String(formData.get("token") || "").trim(),
  });

  window.localStorage.setItem(STORAGE_KEYS.githubSettings, JSON.stringify(state.githubSettings));
  render();
  closeModal(elements.settingsModal);
  setStatus("GitHub settings saved in this browser.");
}

function buildEditorFields(kind, item, defaults = {}) {
  if (kind === "event") {
    const startDate = item?.startDate || defaults.defaultEventStart || new Date();
    const deadline = item?.deadline || getDefaultEventDeadline(startDate);

    return `
      ${buildField("Title", "title", "text", item?.title || "", { required: true, full: true })}
      ${buildField("Start", "startDate", "datetime-local", toDateTimeLocalValue(startDate), { required: true })}
      ${buildField("Deadline", "deadline", "datetime-local", toDateTimeLocalValue(deadline), { required: true })}
      ${buildCheckboxField("Completed", "completed", Boolean(item?.completed))}
      ${buildField("Event type", "eventType", "text", item?.eventType || "General", { required: true })}
      ${buildField("Address", "address", "text", item?.address === "Not set" ? "" : item?.address || "")}
      ${buildTextarea("Details", "details", item?.details || "", { full: true })}
    `;
  }

  return `
    ${buildField("Message", "message", "text", item?.message || "", { required: true, full: true })}
    ${buildField("Time", "time", "datetime-local", toDateTimeLocalValue(item?.time || defaults.defaultReminderTime || getDefaultReminderTime()), { required: true })}
    ${buildCheckboxField("Completed", "completed", Boolean(item?.completed))}
    ${buildCheckboxField("Repeat after completion", "recurring", Boolean(item?.recurring))}
    ${buildField("Repeat every", "recurrenceInterval", "number", String(item?.recurrenceInterval || 1), { min: 1 })}
    ${buildSelectField("Unit", "recurrenceUnit", [
      ["hour", "Hour"],
      ["day", "Day"],
      ["week", "Week"],
      ["month", "Month"],
    ], item?.recurrenceUnit || "day")}
  `;
}

function initializeEditorDefaults(elements, kind, item) {
  if (kind === "reminder") {
    const recurringInput = elements.editorForm.querySelector('input[name="recurring"]');
    const intervalInput = elements.editorForm.querySelector('input[name="recurrenceInterval"]');
    const unitInput = elements.editorForm.querySelector('select[name="recurrenceUnit"]');

    if (!recurringInput || !intervalInput || !unitInput) {
      return;
    }

    const syncRecurringFields = () => {
      const enabled = recurringInput.checked;
      intervalInput.disabled = !enabled;
      unitInput.disabled = !enabled;
    };

    recurringInput.addEventListener("change", syncRecurringFields);
    syncRecurringFields();
    return;
  }

  if (kind !== "event" || item) {
    return;
  }

  const startInput = elements.editorForm.querySelector('input[name="startDate"]');
  const deadlineInput = elements.editorForm.querySelector('input[name="deadline"]');

  if (!startInput || !deadlineInput) {
    return;
  }

  deadlineInput.dataset.autoDerived = "true";

  startInput.addEventListener("input", () => {
    if (deadlineInput.dataset.autoDerived !== "true") {
      return;
    }

    const startDate = parseDateValue(startInput.value);
    if (!startDate) {
      return;
    }

    deadlineInput.value = toDateTimeLocalValue(getDefaultEventDeadline(startDate));
  });

  deadlineInput.addEventListener("input", () => {
    deadlineInput.dataset.autoDerived = "false";
  });
}

function buildField(label, name, type, value, options = {}) {
  const required = options.required ? "required" : "";
  const full = options.full ? " form-field--full" : "";
  const min = options.min !== undefined ? `min="${escapeHtml(String(options.min))}"` : "";

  return `
    <label class="form-field${full}">
      <span class="form-field__label">${escapeHtml(label)}</span>
      <input type="${type}" name="${name}" value="${escapeHtml(String(value || ""))}" ${required} ${min} />
    </label>
  `;
}

function buildCheckboxField(label, name, checked) {
  return `
    <label class="form-field form-field--checkbox">
      <input type="checkbox" name="${name}" ${checked ? "checked" : ""} />
      <span class="form-field__label form-field__label--checkbox">${escapeHtml(label)}</span>
    </label>
  `;
}

function buildSelectField(label, name, options, selectedValue) {
  const renderedOptions = options
    .map(([value, text]) => `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(text)}</option>`)
    .join("");

  return `
    <label class="form-field">
      <span class="form-field__label">${escapeHtml(label)}</span>
      <select name="${name}">
        ${renderedOptions}
      </select>
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

function findItem(state, kind, itemId) {
  const collection = kind === "event" ? state.data.events : state.data.reminders;
  return collection.find((item) => item.id === itemId) || null;
}

function upsertItem(state, collectionKey, item) {
  const collection = state.data[collectionKey];
  const existingIndex = collection.findIndex((entry) => entry.id === item.id);

  if (existingIndex === -1) {
    collection.push(item);
  } else {
    collection.splice(existingIndex, 1, item);
  }

  collection.sort((left, right) => {
    const key = collectionKey === "events" ? "deadline" : "time";
    return left[key] - right[key];
  });
}
