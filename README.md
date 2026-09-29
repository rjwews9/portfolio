# RJ's portfolio

A warm-neutral, editorial portfolio built with plain HTML, CSS, and JavaScript — no framework or bundler. It includes a floating **Ask about RJ** cat assistant, decorative parallax and running cats, a dark mode, and a contact form that emails your inbox. Dependencies: only `nodemailer` (email delivery).

## Project layout

```
server.mjs      Node server: /api routes + static serving when run locally
public/         all site files: index.html, style.css, site.js, chat.js, rjid.png, cat.svg
vercel.json     Vercel routing (serves public/ from the CDN, API from server.mjs)
.env            local secrets — git-ignored, never uploaded (Vercel uses dashboard env vars instead)
```

## Quick start

```powershell
npm install     # once — installs nodemailer
npm start       # http://localhost:3000
npm run check   # syntax check for server.mjs, public/chat.js, public/site.js
```

Requires Node.js 20 or newer.

## Live site (Vercel)

The production site is **https://rjportfolio-sable.vercel.app** (the repo homepage). Vercel deploys automatically on every push to `main`:

- Static files in `public/` are served by Vercel's CDN.
- `server.mjs` is auto-detected as the Node entrypoint and handles `/api/*` (contact form + AI chat).
- Secrets live in the Vercel dashboard (**Project → Settings → Environment Variables**), never in git: `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO` (and optionally `OPENAI_API_KEY`, `SMTP_HOST`, `SMTP_PORT`). Add a variable, then redeploy — env changes only apply to new deployments.

GitHub Pages (`rjwews9.github.io/portfolio`) can only serve the static files: no email delivery and no AI mode there. Point visitors at the Vercel URL.

## Enable the contact form (Gmail)

The form delivers messages to your Gmail inbox via SMTP. Gmail rejects normal account passwords, so use a one-time **App Password**:

1. Turn on **2-Step Verification**: https://myaccount.google.com/security
2. Create an App Password: https://myaccount.google.com/apppasswords (name it “portfolio”)
3. Put both values in a local `.env` (git-ignored) or in Vercel's environment variables:

```dotenv
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-16-character-app-password
CONTACT_TO=whoever-should-receive-it@example.com
```

4. `npm start` locally, or redeploy on Vercel.

Notes:

- `CONTACT_TO` defaults to `SMTP_USER` (the sending account) when unset.
- Optional overrides: `SMTP_HOST` (default `smtp.gmail.com`) and `SMTP_PORT` (default `465`).
- Without SMTP settings the form shows an honest “not configured yet” notice and keeps its send button disabled; Facebook remains the working contact option.
- Submissions are validated server-side (name, email, message; newlines stripped from headers, message line breaks preserved) and rate-limited to 5 attempts per 10 minutes per IP.
- Your email address is never printed in the page — visitors only ever see the form. Credentials stay server-side and are never logged.

## Enable AI answers (optional)

```powershell
$env:OPENAI_API_KEY = "your-api-key"
npm start
```

Or add `OPENAI_API_KEY=...` to `.env` (locally) or the Vercel dashboard. The key stays on the server and usage is billed by your provider. Optional: `OPENAI_MODEL` (default `gpt-4.1-mini`), `PORT` (default `3000`).

The server reads `public/index.html` for each question, so portfolio edits update the assistant automatically, including whether the contact form is configured. Questions and recent replies are sent to OpenAI in AI mode; conversations live only in browser memory.

## Design & customization

- **Colors:** `public/style.css`, section **01. TOKENS** — `--cream` (background), `--beige`, `--sand`, `--charcoal` (text/buttons), `--warm-gray` (secondary text), `--border`. The `body:has(#theme-toggle:checked)` block is the dark palette. `--success` / `--danger` color the form status messages.
- **Typography:** the `--font-body` stack (`"Helvetica Neue", Helvetica, Arial, sans-serif`) is used everywhere; there are no web-font imports. Sizes: `--type-body`, `--type-hero` (hero heading), `--type-surname`, `--type-section` (section headings), `--type-project`. Spacing: `--content-width`, `--gutter`, `--section-space`, `--card-space`.
- **Parallax & cursor effects:** the `MOTION` object at the top of `public/site.js` — `parallaxStrength` (0 disables scroll depth), `heroCursorPx` (hero decoration movement), `cardTiltDegrees` (project card tilt), `pointerEasing` (how fast effects settle), `pointerHighlight` (pointer glow). Individual background speeds are `data-parallax` attributes in `public/index.html`; hero elements carry `data-parallax-hero` and are skipped when offscreen. Effects run only with a fine pointer/hover device and are batched into a single `requestAnimationFrame`.
- **Cats:** three `.cat-runner` elements in `public/index.html` reuse the inline `#running-cat` SVG. Speeds: `--cat-one-speed`, `--cat-two-speed`, `--cat-three-speed` (larger = slower), `--cat-mobile-speed`, and `--cat-stride` (leg cycle) in `public/style.css`. Section **09** defines the running gait: body bound, upper leg, knee/shin, tail and blink animations. Remove a runner to reduce the count; `.cat-three` already hides below 850px and the second lane hides below 600px. Keep runners inside `.cat-lane` so they never cover content.
- **Entrances:** `.is-entering` in `public/style.css` uses `--entrance-duration`, `--entrance-distance`, and per-element `--enter-delay` (project cards stagger via inline `--enter-delay` in `public/index.html`).
- **Motion & accessibility:** “Pause animations” in the hero pauses parallax, entrances, cursor effects and cats. `prefers-reduced-motion` disables all of them and hides the control. Scroll/pointer work is `requestAnimationFrame`-drained, suspended in hidden tabs and offscreen lanes, and cleaned up with `AbortController` on pagehide. Content is never hidden until the entrance observer successfully starts, and navigation, form, and photo viewer work without JavaScript.

## Content

Edit the portfolio in `public/index.html`. Name, photo (`public/rjid.png`), education, skills, project descriptions, location, and social URLs are yours to update. Preserve section IDs and the `.about-text`, `.project-item`, `.tech-tags`, `interest-tags`, `.edu-details`, and `.services-list` hooks used by the basic chatbot. The `.dashboard-container` wrapper is also used by the AI server to read portfolio content.

- **Project links:** no Gym Membership System repository/demo URL was supplied, so its card says so. Add the real URL when available. The portfolio card links to this site; GitHub links point to `github.com/rjwews9`. Project artwork is labeled as illustration, not a screenshot.

`server.mjs` exposes `POST /api/chat`, `GET /api/contact/status`, and `POST /api/contact`, and serves the `public/` files when you run it locally.

## Basic chatbot mode

Opening the site without an API key uses a local keyword-based lookup labeled **Basic mode**. It answers common questions about skills, projects, education, interests, location, and social links, and reflects whether the contact form is configured. If the AI request fails, the panel falls back to it automatically.

## Checks

```powershell
npm run check
```

There is no build step. Verified in Chromium at 320, 375, 600, 768, 850, 1024, 1280, 1366, 1440, and 1920px for overflow, wrapping, navigation, contact delivery, photo-viewer focus/Escape, chatbot replies, dark mode, reduced motion, pause behavior, and no-JavaScript content. Automated axe WCAG A/AA checks passed for light/dark desktop, light mobile, and open mobile chat. Contact delivery is tested end-to-end against a local SMTP test server (validation, rate limiting, success and failure paths) and live on production: status reports configured, the form sends, and mail arrives in the recipient inbox.
