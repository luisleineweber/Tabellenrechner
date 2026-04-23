# Tabellenrechner

Standalone Next.js app for importing amateur football competitions from `fussball.de`, editing match results, and recalculating the live table in a Kicker-like interface.

## Live App

- Production: `https://tabellenrechner.vercel.app/`
- Repository: `https://github.com/Loues000/Tabellenrechner`

The production app is deployed on Vercel. The root `index.html` is only a lightweight handoff page; the real importer lives in `webapp`.

## What It Does

- Import a competition by direct `fussball.de` URL.
- Discover competitions through the legacy WAM filter endpoints.
- Parse standings and all matchdays from legacy `fussball.de` pages.
- Decode obfuscated kickoff times and scores with the published font files.
- Let users edit results client-side and recalculate the live table immediately.
- Keep parser, decoder, search, and table-calculation logic isolated.

V1 does not include user accounts or persistence.

## Repo Layout

```text
.
|-- index.html
|-- samples/
|   `-- fussballde/
|       |-- css/
|       |-- fonts/
|       |-- html/
|       `-- wam/
|-- tasks/
|   |-- lessons.md
|   `-- todo.md
`-- webapp/
    |-- README.md
    |-- package.json
    |-- public/
    `-- src/
        |-- app/
        |   |-- api/
        |   |   |-- competition/route.ts
        |   |   |-- search/bootstrap/route.ts
        |   |   `-- search/competitions/route.ts
        |   |-- globals.css
        |   |-- layout.tsx
        |   `-- page.tsx
        `-- lib/
            |-- fussballde/
            |   |-- font-decoder.ts
            |   |-- legacy.ts
            |   |-- search.ts
            |   `-- types.ts
            |-- table-calculator.test.ts
            `-- table-calculator.ts
```

The root-level npm scripts proxy into `webapp`, so you can work from the repository root without entering the workspace first.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Cheerio for legacy HTML parsing
- Fontkit for `fussball.de` obfuscation-font decoding
- Vitest for table-calculation tests

## Local Development

Requirements:

- Node.js 20.x
- npm

Install and run from the repository root:

```bash
npm install
npm run dev
```

Then open `http://localhost:3001`.

Useful commands:

```bash
npm run lint
npm run test
npm run build
```

You can also work directly inside `webapp/` if you prefer.

## Deployment

Production is deployed on Vercel from the `webapp` root directory.

- Framework preset: `Next.js`
- Root Directory: `webapp`
- Node.js: `20.x`
- Production URL env: `NEXT_PUBLIC_SITE_URL`
- Search Console verification env: `GOOGLE_SITE_VERIFICATION`

If you create another Vercel project from this repository, keep the same settings:

```text
https://vercel.com/new/clone?repository-url=https://github.com/Loues000/Tabellenrechner&root-directory=webapp
```

The importer depends on Next.js server routes under `webapp/src/app/api/*`, so a static host cannot run the full app.

### Google Search / Custom Domain

To make the app discoverable in Google with a stable canonical URL:

1. Add your production domain in Vercel and make it the primary domain.
2. Set `NEXT_PUBLIC_SITE_URL` in the Vercel project to that exact `https://...` URL.
3. Add the site in Google Search Console.
4. Copy the Google verification token into `GOOGLE_SITE_VERIFICATION` in Vercel.
5. Re-deploy and submit `/sitemap.xml` in Search Console.

For local setup, see `webapp/.env.example`.

## How It Works

1. The UI accepts a competition URL or loads filter defaults from `fussball.de/wam_base.json` and related WAM JSON endpoints.
2. The server fetches the selected legacy `fussball.de` competition page and resolves the available matchdays.
3. The importer parses the published table and all fixtures from the legacy markup.
4. Obfuscated date, kickoff, and score text is decoded with the referenced font files.
5. The client keeps edited results in local state and recalculates the standings from the normalized match list.

If the importer cannot parse the source structurally, the app returns a clear error instead of silently degrading.

## Notes

- `fussball.de` legacy markup and WAM endpoints are external dependencies and may change without notice.
- The app currently fetches live upstream data at request time and does not cache imported competitions.
- This project is not affiliated with `fussball.de` or Kicker.
