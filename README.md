# RJ's portfolio

Responsive, matcha-themed portfolio built with plain HTML, CSS, and JavaScript. The floating **Ask about RJ** cat assistant answers questions about the portfolio and matches its light/dark theme. There is no framework, bundler, or production dependency to install.

## Design & customization

- **Colors:** `style.css`, section **01. Design tokens**. Change `--cream`, `--sage`, `--matcha`, `--green`, and `--pink`. The `body:has(#theme-toggle:checked)` block sets the dark palette. Text, borders, and surfaces use semantic variables to preserve readable contrast.
- **Fonts & layout:** the Google Fonts link in `index.html` loads DM Sans and Lora, with local system fallbacks. `--font-body`, `--font-display`, and `--radius` are in `style.css`. Responsive rules are in section **13** (1100px, 850px, and 600px breakpoints).
- **Parallax strength:** `PARALLAX_INTENSITY` in `site.js` scales the effect. Set it to `0` to disable depth. The three `.ambient-shape` elements in `index.html` have individual `data-parallax` speeds. Movement is capped at 100px, reduced on tablets, and disabled on mobile. Important content does not move with parallax.
- **Cats:** the three `.cat-walker` elements in `index.html` reuse the inline `#walking-cat` SVG. Remove a walker to reduce the count, or duplicate one with its own class for another cat. `--cat-one-speed`, `--cat-two-speed`, and `--cat-three-speed` in `style.css` control desktop cycle duration (larger values mean slower movement). Section **09** controls colors, start delays, walking, blinking, tail sway, and bobbing. Section **13** sets slower tablet/mobile durations; only the first cat is shown on mobile. Keep cats inside `.cat-lane` so they cannot obscure content.
- **Assistant logo:** `cat.svg` is the local pastel cat icon used in the chat panel, launcher, and browser favicon.
- **Motion & accessibility:** the “Pause motion” control pauses decorative motion. `prefers-reduced-motion` disables parallax, entrances, walking, blinking, and smooth scrolling automatically. `site.js` batches scroll work with `requestAnimationFrame`, uses `IntersectionObserver` for entrances, and suspends/cleans up work when the page is left. Navigation and content remain usable without JavaScript.

## Content and unfinished integrations

Edit the portfolio in `index.html`. Existing name, photo, education, skills, project descriptions, location, and social URLs are retained. Preserve section IDs and the `.about-text`, `.project-item`, `.tech-tags`, `.interest-tags`, `.edu-details`, and `.services-list` hooks used by the basic chatbot. The `.dashboard-container` wrapper is also used by the AI server to read portfolio content.

- **Contact form:** the original form had no delivery endpoint. Its labeled fields are retained as an explicitly marked preview with a disabled send button. Facebook is the working contact option; no email address was supplied. To enable delivery, connect a real form service, configure its action/method, remove the submit prevention in `site.js`, enable the submit button, update the notice, and test delivery. Update the chatbot's contact instructions if you add a working form or email.
- **Project links:** no Gym Membership System repository/demo URL was supplied. Its card clearly marks that link as missing. Add the real URL when available. The portfolio card links to the current site, and the GitHub link points to the existing profile. Project artwork is labeled as illustration, not a screenshot.

The existing Node server only gained a static route for `site.js`; its AI endpoint is unchanged.

## Enable AI answers

Install Node.js 20 or newer. No npm dependencies are needed. In PowerShell, from this folder:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
npm start
```

Open **http://localhost:3000**. The API key stays on the server. API usage is billed by your provider. Optionally set `OPENAI_MODEL` (default: `gpt-4.1-mini`) or `PORT` (default: `3000`) in the server environment. Environment variables must be set explicitly; this server does not load `.env` files automatically.

The server reads the current `index.html` for each question, so updating the portfolio also updates the AI's source information. It includes recent conversation turns for follow-up questions and instructs the model to acknowledge missing information. Questions and recent replies are sent to OpenAI in AI mode. Conversations are held only in browser memory and reset on reload; this application does not save them.

## Basic mode

Opening `index.html` directly, hosting only the static files, or running without an API key uses a local keyword-based portfolio lookup. This is labeled **Basic mode**, not generative AI. It supports common questions about skills, projects, education, interests, location, and social links. If the AI request fails, the panel automatically uses this mode.

## Hosting

For AI mode, deploy this folder on a Node.js-capable host with `npm start` as the start command and configure `OPENAI_API_KEY` as a server-side secret. Static-only hosts such as GitHub Pages support basic mode only. For a public AI deployment, configure request limits on your host or reverse proxy and spending limits with your API provider.

## Checks

```powershell
npm run check
```

This checks all three JavaScript files. There is no build step for this static site.

Redesign verification was run in Chromium at 320, 375, 600, 768, 850, 1024, 1440, and 1920px widths, covering overflow, navigation, contact preview, photo-viewer focus/Escape, chatbot basic-mode replies, dark mode, reduced motion, and no-JavaScript content. Automated axe WCAG A/AA checks passed for light/dark desktop, light mobile, and open mobile chat. Browser tooling was installed outside the project; it is not a production dependency. Real API replies require a configured key, and contact delivery remains unconfigured.
