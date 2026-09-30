import { expect, test } from "bun:test";
import app from "../src/index";

test("API directory separates interactive docs from the downloadable schema", async () => {
  const response = await app.request("https://library.example/");
  const directory = await response.json() as { data: { documentationUrl: string; openapiUrl: string } };
  expect(directory.data.documentationUrl).toBe("https://library.example/docs");
  expect(directory.data.openapiUrl).toBe("https://library.example/openapi.json");
});

test("Scalar HTML uses the current origin, self-hosted assets, and Dart examples", async () => {
  for (const path of ["/docs", "/docs/"]) {
    const response = await app.request(`https://library.example${path}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(response.headers.get("Content-Language")).toBe("en");
    const html = await response.text();
    expect(html).toContain("Maktabah · API Reference");
    expect(html).toContain('src="/docs-assets/scalar.js"');
    expect(html).toContain('"url": "/openapi.json"');
    expect(html).toContain('"url": "https://library.example"');
    expect(html).toContain('"targetKey": "dart"');
    expect(html).not.toContain("cdn.jsdelivr.net");
    expect(html).not.toContain("proxy.scalar.com");
  }
});

test("docs assets delegate to the Worker asset binding, unknown files remain JSON errors", async () => {
  const urls: string[] = [];
  const env = { ASSETS: { fetch: async (request: Request) => {
    urls.push(request.url);
    return new Response("window.Scalar = {};", { headers: { "Content-Type": "application/javascript" } });
  } } } as unknown as CloudflareBindings;
  const response = await app.request("https://library.example/docs-assets/scalar.js", undefined, env);
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toContain("javascript");
  expect(urls).toEqual(["https://library.example/docs-assets/scalar.js"]);
  const missing = await app.request("https://library.example/docs-assets/missing.js");
  expect(missing.status).toBe(404);
  expect(missing.headers.get("Cache-Control")).toBe("no-store");
  expect((await missing.json() as { error: { code: string } }).error.code).toBe("NOT_FOUND");
  const head = await app.request("https://library.example/docs", { method: "HEAD" });
  expect(head.status).toBe(200);
  expect(await head.text()).toBe("");
});
