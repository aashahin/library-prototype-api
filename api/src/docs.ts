import { Scalar } from "@scalar/hono-api-reference";

export const apiReference = Scalar<{ Bindings: CloudflareBindings }>((c) => {
  c.header("Content-Language", "en");
  return {
    pageTitle: "Maktabah · API Reference",
    url: "/openapi.json",
    cdn: "/docs-assets/scalar.js",
    favicon: "/docs-assets/favicon.svg",
    servers: [{ url: new URL(c.req.url).origin, description: "Maktabah public API" }],
    theme: "default",
    layout: "modern",
    darkMode: false,
    withDefaultFonts: false,
    defaultHttpClient: { targetKey: "dart", clientKey: "http" },
    documentDownloadType: "json",
    showDeveloperTools: "never",
    telemetry: false,
    agent: { disabled: true },
    customCss: `
      :root {
        --scalar-font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        --scalar-font-code: ui-monospace, "Cascadia Code", "Source Code Pro", monospace;
      }
      .light-mode { --scalar-color-accent: #296451; }
      .dark-mode { --scalar-color-accent: #8ed5b9; }
    `,
  };
});
