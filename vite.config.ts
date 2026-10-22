import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Keep the production CSP in one place. Third-party OCR assets are served from
// our own origin, so the policy does not need a CDN exception.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "form-action 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://eutils.ncbi.nlm.nih.gov https://www.ebi.ac.uk https://api.openalex.org",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export default defineConfig({
  // Relative assets keep the same build working on GitHub Pages project sites
  // (https://gaelopr.github.io/scibased/), Netlify, or any static host.
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "scibased-security-meta",
      apply: "build",
      transformIndexHtml(html) {
        // Inject right after the charset so the policy covers every
        // subsequent stylesheet and script, including Vite's module tag.
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`,
        );
      },
    },
  ],
});
