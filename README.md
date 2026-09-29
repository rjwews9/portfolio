# RJ's portfolio

A warm-neutral, editorial portfolio built with plain HTML, CSS, and JavaScript — no framework or bundler. It includes a floating **Ask about RJ** cat assistant, decorative parallax and running cats, a dark mode, and a contact form that can email your inbox. Dependencies: only `nodemailer` (email delivery).

## Quick start

```powershell
npm install     # once — installs nodemailer
npm start       # http://localhost:3000
npm run check   # syntax check for server.mjs, chat.js, site.js
```

Requires Node.js 20 or newer.

## Enable the contact form (Gmail)

The form delivers messages to **your Gmail inbox**. Gmail does not allow your normal account password for SMTP, so create a one-time **App Password**:

1. Turn on **2-Step Verification** for your Google account: https://myaccount.google.com/security
2. Create an App Password (search “App passwords” in Google Account settings, or open https://myaccount.google.com/apppasswords). Pick “Mail” or “Other” and copy the 16-character password.
3. Put both values in a `.env` file in this folder (already git-ignored), or set them as environment variables:

```dotenv
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-16-character-app-password
```

4. Run `npm start`.

Notes:

- Messages are delivered to `SMTP_USER` by default. Set `CONTACT_TO=someone@example.com` to send somewhere else.
- Optional overrides: `SMTP_HOST` (default `smtp.gmail.com`) and `SMTP_PORT` (default `465`).
- The password stays on the server: it is never sent to the browser, logged, or committed. `.env` is ignored by git.
- Without SMTP settings the form shows an honest “not configured yet” notice and keeps its send button disabled; Facebook remains the working contact option.
- Submissions are validated server-side (name, email, message; newlines stripped from headers) and rate-limited to 5 attempts per 10 minutes per IP address.
- Your email address is never printed in the page — visitors only ever see the form.

## Enable AI answers (optional)

```powershell
$env:OPENAI_API_KEY = "your-api-key"
npm start
```

Or add `OPENAI_API_KEY=...` to `.env`. The key stays on the server and usage is billed by your provider. Optional: `OPENAI_MODEL` (default `gpt-4.1-mini`), `PORT` (default `3000`).

The server reads `index.html` for each question, so portfolio edits update the assistant automatically, including whether the contact form is configured. Questions and recent replies are sent to OpenAI in AI mode; conversations live only in browser memory.

## Design & customization

- **Colors:** `style.css`, section **01. TOKENS** — `--cream` (background), `--beige`, `--sand`, `--charcoal` (text/buttons), `--warm-gray` (secondary text), `--border`. The `body:has(#theme-toggle:checked)` block is the dark palette. `--success` / `--danger` color the form status messages.
- **Typography:** the `--font-body` stack (`"Helvetica Neue", Helvetica, Arial, sans-serif`) is used everywhere; there are no web-font imports. Sizes: `--type-body`, `--type-hero` (hero heading), `--type-surname`, `--type-section` (section headings), `--type-project`. Spacing: `--content-width`, `--gutter`, `--section-space`, `--card-space`.
- **Parallax & cursor effects:** the `MOTION` object at the top of `site.js` — `parallaxStrength` (0 disables scroll depth), `heroCursorPx` (hero decoration movement), `cardTiltDegrees` (project card tilt), `pointerEasing` (how fast effects settle), `pointerHighlight` (pointer glow). Individual background speeds are `data-parallax` attributes in `index.html`; hero elements carry `data-parallax-hero` and are skipped when offscreen. Effects run only with a fine pointer/hover device and are batched into a single `requestAnimationFrame`.
- **Cats:** three `.cat-runner` elements in `index.html` reuse the inline `#running-cat` SVG. Speeds: `--cat-one-speed`, `--cat-two-speed`, `--cat-three-speed` (larger = slower), `--cat-mobile-speed`, and `--cat-stride` (leg cycle) in `style.css`. Section **09** defines the running gait: body bound, upper leg, knee/shin, tail and blink animations. Remove a runner to reduce the count; `.cat-three` already hides below 850px and the second lane hides below 600px. Keep runners inside `.cat-lane` so they never cover content.
- **Entrances:** `.is-entering` in `style.css` uses `--entrance-duration`, `--entrance-distance`, and per-element `--enter-delay` (project cards stagger via inline `--enter-delay` in `index.html`).
- **Motion & accessibility:** “Pause animations” in the hero pauses parallax, entrances, cursor effects and cats. `prefers-reduced-motion` disables all of them and hides the control. Scroll/pointer work is `requestAnimationFrame`-drained, suspended in hidden tabs and offscreen lanes, and cleaned up with `AbortController` on pagehide. Content is never hidden until the entrance observer successfully starts, and navigation, form, and photo viewer work without JavaScript.

## Content and unfinished integrations

Edit the portfolio in `index.html`. Name, photo (`rjid.png`), education, skills, project descriptions, location, and social URLs are yours to update. Preserve section IDs and the `.about-text`, `.project-item`, `.tech-tags`, `.interest-tags`, `.edu-details`, and `.services-list` hooks used by the basic chatbot. The `.dashboard-container` wrapper is also used by the AI server to read portfolio content.

- **Project links:** no Gym Membership System repository/demo URL was supplied, so its card says so. Add the real URL when available. The portfolio card links to this site; GitHub links point to `github.com/rjwews9`. Project artwork is labeled as illustration, not a screenshot.

`server.mjs` serves the static files (`/rjid.png`, `/cat.svg`, …) plus `POST /api/chat`, `GET /api/contact/status`, and `POST /api/contact`.

## Basic chatbot mode

Opening `index.html` directly, hosting only static files, or running without an API key uses a local keyword-based lookup labeled **Basic mode**. It answers common questions about skills, projects, education, interests, location, and social links, and reflects whether the contact form is configured. If the AI request fails, the panel falls back to it automatically.

## Hosting

Deploy on a Node.js host with `npm install && npm start` and configure `OPENAI_API_KEY` and `SMTP_USER`/`SMTP_PASS` as server-side secrets (never commit them). Static-only hosts such as GitHub Pages support the basic chatbot but no email delivery. For a public deployment, add rate limits at your host or reverse proxy and set spending limits with your providers.

## Checks

```powershell
npm run check
```

There is no build step. This static site was verified in Chromium at 320, 375, 600, 768, 850, 1024, 1280, 1366, 1440, and 1920px for overflow, wrapping, navigation, contact delivery, photo-viewer focus/Escape, chatbot replies, dark mode, reduced motion, pause behavior, and no-JavaScript content. Automated axe WCAG A/AA checks passed for light/dark desktop, light mobile, and open mobile chat. Contact delivery was tested end-to-end against a local SMTP test server (validation, rate limiting, success and failure paths). Real Gmail delivery requires your App Password; live AI replies require an API key.
