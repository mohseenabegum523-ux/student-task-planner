# StudyFlow — Student Task Planner

A responsive task planner made with HTML, CSS, and vanilla JavaScript. It is designed for GitHub Pages and requires no backend or build step.

## Features
- Add tasks with category and optional due date
- Mark tasks as completed or pending
- Delete tasks
- Filter by all, pending, and completed
- Sort by due date, newest, or task name
- Dashboard totals and completion percentage
- Upcoming deadlines panel
- Saves tasks in browser LocalStorage
- Responsive layout for desktop and mobile

## Run locally
Open `index.html` in a browser, or use the Live Server extension in VS Code.

## Publish with GitHub Pages
1. Create a new public repository on GitHub, for example `student-task-planner`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose branch **main** and folder **/(root)**, then click **Save**.
6. Wait a minute or two and open the Pages URL shown on that screen.

## Notes
- Tasks are saved in the current browser on the current device, not in your GitHub account.
- Clearing browser site data or switching browsers/devices can remove or hide locally saved tasks.
- Google Fonts are used for typography; if unavailable, the page falls back to system fonts.
