# SciBased

**Science-based receipts for your feed.**

SciBased checks viral health claims against peer-reviewed literature. Paste a claim or drop a screenshot, and it returns a plain-English verdict, the studies behind it, and the exact passages those judgments came from.

**Live site:** <https://gaelopr.github.io/scibased/>

The app is mobile-first, runs entirely in the browser, and does not require an account or an API key. Every push to `main` builds and deploys through GitHub Pages.

> **What this is:** a structured, automated evidence scan. It is not a registered systematic review, not a clinician, and not medical advice. Every automated label is shown next to the quoted evidence so it can be checked.

---

## What is live

- **Real literature search** through PubMed E-utilities and OpenAlex.
- **Open-access full-text reading** through Europe PMC for papers that legally expose full text. Results, methods, limitations, and quoted evidence are extracted; the app does not rely only on authors' conclusions.
- **Paywalled papers** are assessed from the abstract and metadata only. **Sci-Hub and other unauthorized full-text sources are not used.**
- **Local screenshot OCR** with Tesseract.js. The image stays on the device; only the extracted claim text is sent to the literature APIs.
- **Deterministic verdict synthesis** based on study design, sample size, directness, consistency, risk of bias, access level, and the direction of the results. No LLM is asked to invent a conclusion.
- **Transparent coverage:** records found, abstracts screened, studies included, full texts read, open-access links available, search date, exact query, and limitations.
- **Three verdict states:** Verified (`#10B981`), Needs context (`#F59E0B`), Debunked (`#EF4444`).
- **Per-study evidence cards:** design, direction, access, sample, directness, certainty, key finding, methods, limitations, risk of bias, extra excerpts, and links to PubMed, the publisher/DOI, open full text, and Google Scholar.
- **Three clearly labelled sample verdicts** for previewing the interface. They are never mixed with live results.

## What it does not do

- It does not access paywalled full text through Sci-Hub or any other unauthorized source.
- It does not treat an empty search as proof that a claim is false.
- It does not replace a clinician, a registered systematic review, or a full risk-of-bias assessment.
- It cannot rule out publication bias or errors in the primary literature.
- Automated direction labels can misclassify a sentence. The exact quotes and links are included so a reader can verify them.

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Type | Inter (UI) + Newsreader (editorial serif) |
| OCR | Tesseract.js, running locally in the browser |
| Literature | PubMed E-utilities, OpenAlex, Europe PMC REST |

## Getting started

```bash
cd scibased
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

On Windows PowerShell, use `npm.cmd` if script execution is disabled:

```powershell
npm.cmd install
npm.cmd run dev
```

### Production build

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # serve dist/ locally
```

The static output is written to `dist/`.

## How a scan works

1. **Parse the claim** into concepts, claim type (safety, efficacy, causation, association, or mechanism), and a focused PubMed query.
2. **Search PubMed** for relevance-ranked records and **OpenAlex** for supplemental records.
3. **Screen the abstracts** for relevance to the claim's exposure and outcome.
4. **Include up to 10 studies** after screening.
5. **Read full text** for up to 8 legally open-access papers through Europe PMC. Other papers are assessed from abstracts.
6. **Extract evidence** — result sentences, methods, limitations, sample size, population, and direction — with exact quotes.
7. **Grade and synthesize** using a transparent rule set, not a generated conclusion.
8. **Return** the verdict, score, certainty, study cards, coverage, and methodology.

### Evidence limits

- Search is limited to English-language, PubMed- and OpenAlex-indexed literature with abstracts.
- NCBI's unauthenticated E-utilities limit is respected by keeping the scan small.
- Full text is read only where Europe PMC exposes it legally.
- The direction label is an automated screening aid. The study card shows the sentence it relied on.
- The score is a claim-support score, not a probability that the claim is true.

## Project structure

```
scibased/
├─ .github/workflows/deploy.yml   # build + GitHub Pages deployment
├─ public/ocr/                    # local Tesseract worker, WASM core, English model
├─ public/.well-known/security.txt
├─ src/
│  ├─ App.tsx                     # home | loading | results; live vs sample flow
│  ├─ components/
│  │  ├─ Header.tsx               # sticky navbar + logo lockup
│  │  ├─ HomeScreen.tsx           # hero + input + trending samples
│  │  ├─ ClaimInput.tsx           # upload, paste, textarea, CTA
│  │  ├─ TrendingList.tsx         # interactive sample claims
│  │  ├─ LoadingState.tsx         # real progress + skeletons
│  │  ├─ ResultsScreen.tsx        # live results layout
│  │  ├─ VerdictCard.tsx          # verdict + score ring
│  │  ├─ EvidenceOverview.tsx     # coverage, methodology, certainty
│  │  ├─ StudyCard.tsx            # study-level evidence and links
│  │  └─ Footer.tsx
│  ├─ data/mockResults.ts         # three labelled sample verdicts
│  ├─ lib/
│  │  ├─ fetchScientificData.ts   # UI ↔ evidence engine seam
│  │  ├─ ocr.ts                   # local Tesseract OCR
│  │  └─ evidence/
│  │     ├─ scan.ts               # search → screen → full text → synthesize
│  │     ├─ pubmed.ts             # E-utilities search + XML parsing
│  │     ├─ openalex.ts           # supplemental records
│  │     ├─ fullText.ts           # Europe PMC JATS parsing
│  │     ├─ extract.ts            # designs, direction, samples, quotes
│  │     ├─ grade.ts              # certainty, weighting, verdict
│  │     ├─ query.ts              # claim parsing and query construction
│  │     └─ config.ts             # design weights, synonyms, limits
│  ├─ index.css                   # theme, atmosphere, skeletons, motion
│  └─ types.ts                    # shared contracts
├─ index.html
├─ SECURITY.md                    # security model and disclosure policy
└─ vite.config.ts
```

## Demo behavior

The three trending cards and the three buttons under the claim box open **labelled samples**. They are useful for previewing the three verdict states without waiting for a live scan. Typed claims and uploaded screenshots always run the live pipeline.

The sample claims are:

| Claim | Verdict | Score |
| --- | --- | --- |
| Creatine supplementation is safe for healthy kidneys. | Verified | 93 |
| Magnesium supplements improve deep sleep cycles and cure insomnia. | Needs context | 47 |
| Drinking ice water causes gut issues and stops digestion. | Debunked | 14 |

All sample citations are real and link to PubMed records.

## Screenshot OCR and privacy

- Tesseract.js, its WASM core, and the English language model are served from this origin under `public/ocr/` — no runtime CDN request.
- The image is processed locally in the browser and is not uploaded to SciBased or to a literature API.
- Screenshots are capped at 10 MB and 40 megapixels.
- Only the extracted claim text is sent to PubMed, OpenAlex, and Europe PMC.
- API requests use `credentials: "omit"` and `referrerPolicy: "no-referrer"`.
- There are no accounts, analytics, cookies, or server-side storage in this build.

## Security

- **Strict production CSP** (injected by `vite.config.ts`): scripts only from this origin, no form submissions, and network access limited to PubMed, Europe PMC, and OpenAlex. Framing protection is sent as an HTTP header where the host supports it (`frame-ancestors` is ignored in a meta tag).
- **No dynamic HTML:** evidence text is rendered through React escaping; metadata HTML is decoded with an inert `DOMParser`.
- **Link allow-list:** study links from third-party metadata must use `https:`; `javascript:`, `data:`, `http:`, and `file:` links are dropped.
- **API allow-list:** the fetch wrapper rejects origins outside the three literature APIs.
- **Private disclosure:** see [`SECURITY.md`](SECURITY.md) and `/.well-known/security.txt`.
- **Dependency hygiene:** `npm audit --omit=dev` is clean; Dependabot watches npm and GitHub Actions updates.

GitHub Pages does not support custom response headers, so the CSP is delivered with a meta tag. `public/_headers` contains the full header set for hosts that support it (Netlify, Cloudflare Pages). `frame-ancestors` only works as a real header; see the security notes for details.

## Accessibility and responsive QA

- WCAG 2.1 A/AA axe audit passes with **zero violations** on the home screen and live results.
- No horizontal overflow at 320–1440 px in automated viewport checks.
- Keyboard support: `Ctrl/Cmd + Enter` analyzes the current claim.
- The loading panel is a polite live region with a labelled progress bar.
- `prefers-reduced-motion` disables animations and smooth scrolling.
- Every control has a visible label or accessible name; focus states are visible.

## Deploying a permanent public URL

The production site is deployed from this repository to GitHub Pages:

**<https://gaelopr.github.io/scibased/>**

The workflow at `.github/workflows/deploy.yml` runs `npm ci` and `npm run build`
on every push to `main`, then publishes `dist/` to Pages. In the repository,
Pages is configured with **Source: GitHub Actions**.

The app needs no server, environment variables, or API keys. To host it
elsewhere, run `npm run build` and serve the contents of `dist/` as static
files. The included `public/_headers` adds full HTTP security headers on hosts
that support them; GitHub Pages ignores that file and uses the meta CSP instead.

## Disclaimer

SciBased is an educational synthesis of peer-reviewed evidence, not medical advice. For personal health decisions, talk to a qualified clinician.
