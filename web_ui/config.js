window.OPEN_CALENDAR_CONFIG = {
  appTitle: "OpenCalendar",
  subtitle: "A desktop-ready planner with JSON-backed GitHub sync.",
  monthsToRender: 6,
  upcomingDays: 5,
  menuBarHeight: 37,
  viewportWidth: 1280,
  viewportHeight: 832,
  dataSources: {
    calendar: "../database/calendar-data.json",
    events: "../database/events.csv",
    reminders: "../database/reminders.csv",
  },
  github: {
    owner: "YuxuanZhang271",
    repo: "OpenCalender",
    branch: "main",
    dataPath: "database/calendar-data.json",
    commitMode: "actions",
    dispatchEventType: "calendar_data_sync",
    token: "",
  },
};
