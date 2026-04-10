## What I want to develop
A light-weight calender web ui that can deploy as your desktop. 

## Functions
1. A calender-like one-page web_ui
   - the solution (width x height) should be the same as the MacBook Air M2 Screen, to fit my desktop revealing, or you can make a config file for customization
   - the duration should be the future 6 months from now on
   - show the calender for one month but can scroll down to see future months
2. Events
   - to add events, I'd like to know the `Title (str), Deadline (datetime), Event Type (str), address, etc`
   - can manage the events
   - to store events, refer to `../database/events.csv`
3. Reminders
   - basically the same as events, includes `Message (str), Time (datetime)`

## Deployment
1. Deploy the web_ui through github pages or actions
2. To interact: 
   - Through web_ui, to manage your events and reminders via scripts
   - Through Codex, update events and reminders locally, and update with `/GitHub` skills

## UI Design
1. calender is the main body of the web_ui
2. For events: 我想要的是那种从当前状态一直延伸到ddl的视觉效果
3. For reminders: 放在对应天数的单点效果
4. 鼠标移动到对应的elements上面会显示基本信息，点击后可以弹窗进入编辑信息
5. above or below the calender, should list out events and reminders for the next n days, like 5 days

## Current Implementation Notes
- Primary storage is now `../database/calendar-data.json`.
- The browser keeps edits in a local draft until you click `Publish changes`.
- `GitHub Actions` mode triggers repository dispatch and lets the workflow commit the JSON file.
- `Contents API` mode writes the JSON file directly through GitHub's contents endpoint.
- Existing CSV files remain as import-friendly fallback data, but JSON is the collaboration format now.
