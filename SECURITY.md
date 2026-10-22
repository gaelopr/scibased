# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private
vulnerability reporting instead:

<https://github.com/gaelopr/scibased/security/advisories/new>

Include the page or component affected, the steps to reproduce it, and what an
attacker could do. You can expect an initial response within 7 days.

## Security model

SciBased is a static, client-side app. It has no backend, accounts, database,
cookies, analytics, or API secrets. The security controls that matter here are
browser-side:

- **Content Security Policy:** the production build injects a strict CSP that
  allows scripts only from this origin, blocks form submission, and limits
  network requests to the three literature APIs. `frame-ancestors` and
  `X-Frame-Options` are sent as real headers where the host supports them;
  browsers ignore those directives in a meta tag.
- **Local OCR assets:** Tesseract.js, its WASM core, and the English language
  model are served from this origin rather than a third-party CDN.
- **No HTML injection:** all API and OCR text is rendered through React's text
  escaping. PubMed records are parsed with `DOMParser`, and outbound study links
  are restricted to `https:` URLs.
- **API allow-list:** the fetch wrapper refuses any literature request whose
  origin is not PubMed E-utilities, Europe PMC, or OpenAlex.
- **Upload limits:** screenshots are capped at 10 MB and 40 megapixels, and are
  processed locally in the browser. Only extracted claim text is sent to the
  literature APIs.
- **Privacy:** no image is uploaded; requests are sent with
  `credentials: "omit"` and `referrerPolicy: "no-referrer"`.

## Deployment headers

GitHub Pages serves the static build over HTTPS, but it does not allow custom
response headers. The CSP is therefore delivered with a `<meta http-equiv>`
tag, and `public/_headers` is included for hosts (for example Netlify or
Cloudflare Pages) that support header files. Where custom headers are
available, serve:

```text
Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self' 'wasm-unsafe-eval'; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' https://eutils.ncbi.nlm.nih.gov https://www.ebi.ac.uk https://api.openalex.org; worker-src 'self' blob:; child-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

`frame-ancestors` and `X-Frame-Options` are ignored when delivered through a
meta tag; they work only as HTTP response headers.

## Scope

Reports about the literature synthesis itself (a study label, a quoted
sentence, or the verdict logic) are welcome as normal issues, not security
reports. The app is educational and is not medical advice.
