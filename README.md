# OpenCalender

OpenCalender is a lightweight calendar web app designed for GitHub Pages and desktop display. You can fork it, host it as a static site, edit your own schedule in the browser, and sync data back to your repository through GitHub API and GitHub Actions.
![opencalender](imgs/opencalender.png)

## Contents
- [OpenCalender](#opencalender)
  - [Contents](#contents)
  - [Overview](#overview)
  - [How It Works](#how-it-works)
  - [Quick Start](#quick-start)
    - [1. Fork This Repository](#1-fork-this-repository)
    - [2. Enable GitHub Pages](#2-enable-github-pages)
    - [3. Enable GitHub Actions Write Access](#3-enable-github-actions-write-access)
    - [4. Create A Fine-Grained PAT](#4-create-a-fine-grained-pat)
    - [5. Open The App And Configure GitHub Sync](#5-open-the-app-and-configure-github-sync)
    - [6. Validate The Full Flow](#6-validate-the-full-flow)
    - [7. Deploy To Your Local Desktop](#7-deploy-to-your-local-desktop)
  - [Basic Usage Guide](#basic-usage-guide)
    - [Add Items](#add-items)
    - [Edit Items](#edit-items)
    - [Delete Items](#delete-items)
    - [Save Versus Publish](#save-versus-publish)
    - [Navigation](#navigation)
    - [Themes](#themes)

## Overview

This project is built for people who want:

- a simple calendar web UI
- static hosting through GitHub Pages
- browser-side editing without running a backend server
- JSON as the main collaboration format
- GitHub-backed publishing for personal schedule updates

## How It Works

- The primary data source is `database/calendar-data.json`.
- The browser loads that JSON and renders the calendar.
- When you add or edit items, the page first saves them to browser-local draft state.
- When you click `Publish changes`, the app sends the JSON payload to GitHub.
- The default sync mode triggers `.github/workflows/calendar-data-sync.yml`, and the workflow commits the new JSON back to your repository.
- `database/events.csv` and `database/reminders.csv` remain in the repository only as compatibility files. JSON is the source of truth.

## Quick Start

1. Fork this repository.
2. Enable GitHub Pages for your fork.
3. Enable GitHub Actions write permissions.
4. Create a fine-grained GitHub personal access token.
5. Open the site, fill in `GitHub settings`, and save.
6. Add a reminder, click `Publish changes`, and confirm that the workflow updates `database/calendar-data.json`.
7. If you want a desktop calendar, open the GitHub Pages URL in Plash.

### 1. Fork This Repository

1. Sign in to GitHub.
2. Open the original repository page.
3. Click `Fork`.
4. Create the fork under your own GitHub account.
5. Clone your fork locally if you want to customize code:

```bash
git clone https://github.com/<your-github-user>/OpenCalender.git
cd OpenCalender
```

### 2. Enable GitHub Pages

Open your fork on GitHub, then:

1. Go to `Settings > Pages`.
2. In `Build and deployment`, set `Source` to `Deploy from a branch`.
3. Select branch `main`.
4. Select folder `/(root)`.
5. Save the settings.

Because the UI entry file is currently `web_ui/index.html`, the live URL will usually be:

`https://<your-github-user>.github.io/OpenCalender/web_ui/`

Example for this fork:

`https://yuxuanzhang271.github.io/OpenCalender/web_ui/`

Official reference:
- [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### 3. Enable GitHub Actions Write Access

The app uses GitHub Actions to commit updated JSON back to the repository. Without write permission, publish will trigger but the workflow may fail when pushing.

In your fork:

1. Go to `Settings > Actions > General`.
2. Make sure Actions are enabled for the repository.
3. Scroll to `Workflow permissions`.
4. Select `Read and write permissions`.
5. Save.

Official reference:
- [Managing GitHub Actions settings for a repository](https://docs.github.com/github/administering-a-repository/disabling-or-limiting-github-actions-for-a-repository)

### 4. Create A Fine-Grained PAT

Create a token only for your fork. Do not commit the token into code.

Open:

`GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens`

Recommended settings:

- `Token name`: `opencalendar-web-sync`
- `Expiration`: choose a duration you are comfortable with
- `Resource owner`: your GitHub username or organization
- `Repository access`: `Only select repositories`
- Repository selection: your fork of `OpenCalender`
- `Repository permissions`:
  `Contents`: `Read and write`

After creation:

- copy the token immediately
- keep it private
- paste it only into the app's `GitHub settings` dialog
- never put it in `web_ui/config.js`

Official reference:
- [Creating a fine-grained personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)
- [Create a repository dispatch event](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28)
- [Create or update file contents](https://docs.github.com/en/rest/repos/contents)

### 5. Open The App And Configure GitHub Sync

Open your GitHub Pages URL, then use the `GitHub settings` button in the left `Repository flow` panel.

Fill in:

- `owner`: your GitHub username or organization
- `repo`: `OpenCalender`
- `branch`: `main`
- `dataPath`: `database/calendar-data.json`
- `commitMode`: `actions`
- `dispatchEventType`: `calendar_data_sync`
- `token`: your fine-grained PAT

Then click `Save settings`.

Important notes:

- these settings are stored in your browser `localStorage`
- they are not written back into the repository
- if you switch browsers or clear local storage, you need to enter them again

### 6. Validate The Full Flow

This is the recommended first test after setup.

1. Open the site.
2. Click `Add reminder`.
3. Enter a test message and time.
4. Click `Save item`.
5. Confirm that the item appears in the calendar or upcoming list.
6. Click `Publish changes`.
7. Open the `Actions` tab in your GitHub fork.
8. Wait for the `Calendar Data Sync` workflow to finish successfully.
9. Open `database/calendar-data.json` in your fork and confirm the new reminder exists.
10. Refresh the site and confirm the data still appears.

If all 10 steps work, your fork is correctly configured.

### 7. Deploy To Your Local Desktop

One simple way to use OpenCalender as a desktop calendar on macOS is [Plash](https://sindresorhus.com/plash).
![plash](imgs/plash.png)

Setup flow:

1. Install `Plash` from the Mac App Store.
2. Copy your GitHub Pages URL, for example:
   `https://<your-github-user>.github.io/OpenCalender/web_ui/`
3. Open Plash.
4. Create a new site or desktop widget.
5. Paste the GitHub Pages URL.
6. Resize and position it to fit your desktop.

The project was designed with a desktop-sized calendar layout in mind, so this works well as a personal always-visible planner.

## Basic Usage Guide

### Add Items

- Click `Add event` to create a long-running event with a start date and deadline.
- Click `Add reminder` to create a point-in-time reminder.

### Edit Items

- Click an event bar in the calendar to edit that event.
- Click a reminder dot in the calendar to edit that reminder.
- Click an item in `Upcoming items` to edit it.

### Delete Items

- Open an event or reminder.
- Click `Delete`.
- The deletion is applied to your local draft first.

### Save Versus Publish

- `Save item` only updates the local browser draft.
- `Publish changes` sends the current draft to GitHub.
- Until you publish, GitHub repository data is unchanged.

### Navigation

- `Jump to today` scrolls back to the current month.
- `Refresh data` reloads repository data.
- If you have unpublished draft changes, refresh will ask whether to discard them.

### Themes

- Use `Dark mode` or `Light mode` from the header.
- Theme preference is stored in browser local storage.

<!-- ## Data Files

### Primary file

- `database/calendar-data.json`

This file contains:

- `version`
- `updatedAt`
- `events`
- `reminders`

### Compatibility files

- `database/events.csv`
- `database/reminders.csv`

These are intentionally kept minimal. They are not the main shared format anymore.

## Local Preview And Validation

If you want to preview locally instead of waiting for GitHub Pages:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000/web_ui/`

If you have Node.js available, you can also validate the JSON structure locally:

```bash
node scripts/sync-calendar-data.mjs --validate --file database/calendar-data.json
```

## Troubleshooting

### The page loads but Publish changes fails

Check:

- `GitHub settings` were saved in the browser
- the PAT is still valid
- the PAT has `Contents: Read and write`
- `Workflow permissions` are set to `Read and write permissions`

### GitHub settings button does not open

Refresh the page after pulling the latest code from your fork. Older cached Pages builds may still be serving old JavaScript.

### GitHub Pages is enabled but the site looks blank

Make sure you are opening:

`https://<your-github-user>.github.io/OpenCalender/web_ui/`

The app entry file lives under `web_ui/`, not the repository root.

### I accidentally committed my PAT

Do all of the following immediately:

1. Revoke the token in GitHub.
2. Remove it from your code.
3. Rewrite the affected commit if necessary.
4. Generate a brand new token.

## Documentation

This repository is designed for the following interaction loop:

1. Fork the project.
2. Configure GitHub Pages and GitHub Actions permissions.
3. Create a fine-grained PAT and store it only in the browser.
4. Use the page to add, edit, and delete events or reminders.
5. Publish updates back to your own fork through GitHub Actions.
6. Optionally pin the hosted page to your local desktop with Plash. -->
