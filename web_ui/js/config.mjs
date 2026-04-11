const RAW_CONFIG = window.OPEN_CALENDAR_CONFIG || {};

export const DEFAULT_DATA_PATH = "../database/calendar-data.json";
export const DEFAULT_DISPATCH_EVENT = "calendar_data_sync";
export const MAX_EVENT_LANES = 3;

export const APP_CONFIG = {
  appTitle: "OpenCalendar",
  subtitle: "A desktop-ready planner for the next six months.",
  monthsToRender: 6,
  upcomingDays: 5,
  menuBarHeight: 37,
  viewportWidth: 1280,
  viewportHeight: 832,
  dataPath: RAW_CONFIG.dataPath || RAW_CONFIG.dataSources?.calendar || DEFAULT_DATA_PATH,
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

export const STORAGE_KEYS = {
  theme: "open-calendar-theme",
  githubSettings: "open-calendar-github-settings",
  draftData: "open-calendar-draft-data",
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DATETIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

export const EVENT_TYPE_COLORS = {
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

export const EVENT_TYPE_FALLBACK_PALETTE = [
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
