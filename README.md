# Pinboard Panic — a tiny, very unofficial darts game

A responsive browser game made with plain HTML, CSS, and JavaScript. It works on GitHub Pages, so **you do not need a backend server**.

## Run it locally
Open `index.html` in a browser. No build tools or dependencies are required.

## Publish with GitHub Pages
1. Create a public GitHub repository and upload all files in this folder.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select your default branch (usually `main`) and folder **`/ (root)`**, then save.
5. Wait for GitHub Pages to publish the site. The URL will appear in the Pages settings.

## Make it your own
- Replace `assets/target.svg` with your own square image. Keep the filename the same, or update the `src` on the `img#targetImage` element in `index.html`.
- The game scores distance from the center of the square target: 100, 60, 25, or 5 points.
- Edit the funny messages and score thresholds in `game.js`.
- Fonts are loaded from Google Fonts; if unavailable, the page falls back to system fonts.

## Controls
- Click the horizontal bar to set X.
- Click the vertical bar to set Y.
- Press **Lock Aim & Throw**, or press **Space**.
- Five darts per round. Try again after the result screen.

## Notes
GitHub Pages serves static files; it does not run a private server-side backend. This game is entirely client-side and does not collect or transmit player data.
