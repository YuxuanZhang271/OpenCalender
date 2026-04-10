# OpenCalender
This is a automatic pipeline coded and handled by Codex. You can deploy it as your personal calender desktop!

- [OpenCalender](#opencalender)
  - [Preparation](#preparation)
    - [Plash](#plash)
    - [Codex](#codex)

## Preparation
### Plash
To deploy your calender website as your desktop, you can install `Plash` from App Store, developed by [Sindre Sorhus 🦄](https://sindresorhus.com). 
![Install Plash from App Store](imgs/plash.png)

### Codex

## Data Flow
The calendar now uses `database/calendar-data.json` as the primary data source.

- `web_ui/` reads JSON directly and keeps edits in a browser-local draft first.
- `GitHub Actions` mode sends the JSON payload to `.github/workflows/calendar-data-sync.yml`, and the workflow validates then commits the update.
- `Contents API` mode skips Actions and writes the JSON file directly through the GitHub contents endpoint.
- Legacy CSV files are still present as fallback seed data, but JSON is the source of truth moving forward.

## Editing And Sync
Open the page, edit an event or reminder, then click `Publish changes`.

- `GitHub settings` are stored in browser `localStorage`, not in the repository.
- The default repository path is `database/calendar-data.json`.
- For personal use, `GitHub Actions` mode is recommended because the workflow performs the commit inside GitHub after the browser dispatches the payload.

## Local Validation
You can validate the JSON payload structure locally with:

```bash
node scripts/sync-calendar-data.mjs --validate --file database/calendar-data.json
```
