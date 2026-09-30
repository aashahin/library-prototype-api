import { expect, test } from "bun:test";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import specJson from "../public/openapi.json";
import app from "../src/index";

type Schema = Record<string, unknown> & { $ref?: string };
interface ApiResponse {
  $ref?: string;
  content?: Record<string, { schema: Schema; examples?: Record<string, { value: unknown }> }>;
}
interface ApiSpec {
  paths: Record<string, { get: { responses: Record<string, ApiResponse> } }>;
  components: { schemas: Record<string, Schema>; responses: Record<string, ApiResponse> };
}
const spec: ApiSpec = specJson;
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const schemaId = "https://maktabah.test/openapi.json";
ajv.addSchema({ $id: schemaId, components: spec.components });

function resolveResponse(response: ApiResponse): ApiResponse {
  if (!response.$ref) return response;
  const name = response.$ref.split("/").at(-1)!;
  return spec.components.responses[name]!;
}

test("all OpenAPI component schemas compile and all local references resolve", () => {
  for (const name of Object.keys(spec.components.schemas)) {
    expect(ajv.compile({ $ref: `${schemaId}#/components/schemas/${name}` })).toBeFunction();
  }
  function checkReferences(value: unknown): void {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key === "$ref" && typeof item === "string" && item.startsWith("#/")) {
        let target: unknown = specJson;
        for (const part of item.slice(2).split("/")) {
          expect(target).toBeObject();
          target = (target as Record<string, unknown>)[part.replace(/~1/g, "/").replace(/~0/g, "~")];
        }
        expect(target).toBeDefined();
      } else checkReferences(item);
    }
  }
  checkReferences(specJson);
});

test("published JSON examples conform to the same schemas as live responses", () => {
  let examplesChecked = 0;
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const [status, response] of Object.entries(item.get.responses)) {
      const media = resolveResponse(response).content?.["application/json"];
      if (!media?.examples) continue;
      const validate = ajv.compile(media.schema.$ref ? { $ref: `${schemaId}${media.schema.$ref}` } : media.schema);
      for (const [name, example] of Object.entries(media.examples)) {
        expect(validate(example.value), `${path} ${status} ${name}: ${JSON.stringify(validate.errors)}`).toBe(true);
        examplesChecked++;
      }
    }
  }
  expect(examplesChecked).toBeGreaterThan(0);
});

test.each([
  ["/", "/"],
  ["/health", "/health"],
  ["/api/v1/books", "/api/v1/books"],
  ["/api/v1/books", "/api/v1/books?page=2&limit=3&sort=rating"],
  ["/api/v1/books", "/api/v1/books?q=missing"],
  ["/api/v1/categories", "/api/v1/categories"],
  ["/api/v1/home", "/api/v1/home?category=science"],
  ["/api/v1/demo-state", "/api/v1/demo-state"],
  ["/api/v1/books/{bookId}", "/api/v1/books/light"],
  ["/api/v1/books/{bookId}/chapters", "/api/v1/books/light/chapters"],
  ["/api/v1/books/{bookId}/chapters/{index}", "/api/v1/books/light/chapters/0"],
  ["/api/v1/books/{bookId}/chapters/{index}", "/api/v1/books/light/chapters/2"],
])("actual %s response matches published schema for %s", async (path, url) => {
  const response = await app.request(`https://library.example${url}`);
  expect(response.status).toBe(200);
  const schema = resolveResponse(spec.paths[path]!.get.responses["200"]!).content!["application/json"]!.schema;
  const validate = ajv.compile(schema.$ref ? { $ref: `${schemaId}${schema.$ref}` } : schema);
  const body = await response.json();
  expect(validate(body), JSON.stringify(validate.errors)).toBe(true);
});

test.each([
  ["/api/v1/books?page=0", 400],
  ["/api/v1/books/missing", 404],
  ["/api/v1/books/light/chapters/3", 404],
  ["/api/v1/books/light/chapters/bad", 400],
  ["/images/missing.png", 404],
  ["/missing", 404],
])("actual error for %s matches ErrorResponse", async (url, status) => {
  const response = await app.request(`https://library.example${url}`);
  expect(response.status).toBe(status);
  const validate = ajv.compile({ $ref: `${schemaId}#/components/schemas/ErrorResponse` });
  expect(validate(await response.json()), JSON.stringify(validate.errors)).toBe(true);
});
