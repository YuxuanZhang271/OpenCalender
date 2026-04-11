import { APP_CONFIG, STORAGE_KEYS } from "./js/config.mjs";
import {
  applyTheme,
  closeModal,
  getInitialTheme,
  openModal,
} from "./js/utils.mjs";
import {
  clearDraft,
  createEmptyCalendarData,
  loadDraft,
  loadRepositoryData,
  loadStoredGithubSettings,
  mergeGithubSettings,
  normalizeCalendarData,
} from "./js/data.mjs";
import { renderAll, hideStatus, setStatus } from "./js/render.mjs";
import {
  deleteEditorItem,
  openEditor as showEditor,
  openSettingsModal,
  populateSettingsForm,
  saveEditorItem,
  saveGithubSettings,
} from "./js/editor.mjs";
import { publishChanges } from "./js/github.mjs";

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

  applyTheme(getInitialTheme(STORAGE_KEYS.theme), elements.themeToggle);
  bindEvents();
  populateSettingsForm({ state, elements });
  render();
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

    clearDraft(state);
    await loadAndRender({ forceRemote: true });
  });

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, elements.themeToggle);
    window.localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  });

  elements.addEvent.addEventListener("click", () => openEditor("event"));
  elements.addReminder.addEventListener("click", () => openEditor("reminder"));
  elements.publishChanges.addEventListener("click", () => {
    publishChanges({
      state,
      render,
      setStatus: (message) => setStatus(elements, message),
      openSettingsModal: () => openSettingsModal({ state, elements, openModal }),
    });
  });
  elements.configureGithub.addEventListener("click", () => {
    openSettingsModal({ state, elements, openModal });
  });

  elements.editorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveEditorItem({
      state,
      elements,
      render,
      closeModal,
      setStatus: (message) => setStatus(elements, message),
    });
  });

  elements.deleteItem.addEventListener("click", () => {
    deleteEditorItem({
      state,
      elements,
      render,
      closeModal,
      setStatus: (message) => setStatus(elements, message),
    });
  });

  elements.cancelEditor.addEventListener("click", () => closeModal(elements.editorModal));
  elements.cancelEditorSecondary.addEventListener("click", () => closeModal(elements.editorModal));

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveGithubSettings({
      state,
      elements,
      render,
      closeModal,
      setStatus: (message) => setStatus(elements, message),
    });
  });

  elements.closeSettings.addEventListener("click", () => closeModal(elements.settingsModal));
  elements.closeSettingsSecondary.addEventListener("click", () => closeModal(elements.settingsModal));
}

async function loadAndRender(options = {}) {
  setStatus(elements, "Loading calendar data...");

  try {
    const remoteData = await loadRepositoryData();
    const draftData = options.forceRemote ? null : loadDraft();

    state.data = draftData ? normalizeCalendarData(draftData) : remoteData;
    state.dirty = Boolean(draftData);
    state.lastLoadedAt = new Date();

    render();

    if (draftData) {
      setStatus(elements, "Loaded local draft changes. Publish when you are ready.");
    } else {
      hideStatus(elements);
    }
  } catch (error) {
    console.error(error);
    state.data = createEmptyCalendarData();
    state.dirty = false;
    render();
    elements.calendarContainer.innerHTML = `
      <div class="status-banner">
        The page could not load calendar data. If you opened this file directly, serve it through a local server or GitHub Pages.
      </div>
    `;
    setStatus(elements, "Unable to load calendar data.");
  }
}

function openEditor(kind, itemId = null) {
  showEditor({
    state,
    elements,
    kind,
    itemId,
    openModal,
  });
}

function render() {
  renderAll({
    state,
    elements,
    openEditor,
  });
}
