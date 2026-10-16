import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleCandidateAuthRoute } from "./candidate-auth-http";
import type { CandidateAuthService } from "./candidate-auth-service";

function responseMock() {
  const headers = new Map<string, string>();
  let body = "";
  let statusCode = 200;
  const response = {
    setHeader(name: string, value: string) { headers.set(name.toLowerCase(), value); },
    end(value?: string) { body = value ?? ""; }
  } as unknown as ServerResponse;
  Object.defineProperty(response, "statusCode", {
    get: () => statusCode,
    set: (value: number) => { statusCode = value; }
  });
  return { response, headers, get body() { return body; }, get statusCode() { return statusCode; } };
}

function requestMock(method: string, origin?: string) {
  return {
    method,
    headers: { origin },
    socket: { remoteAddress: "127.0.0.1" }
  } as unknown as IncomingMessage;
}

test("candidate auth route rejects state changes without the configured exact origin", async () => {
  process.env.KINGSMEN_CANDIDATE_PORTAL_ORIGIN = "https://portal.example.test";
  const res = responseMock();
  const handled = await handleCandidateAuthRoute(
    requestMock("POST", "https://attacker.example.test"), res.response,
    "/api/candidate-auth/login", null,
    (response, status, body) => {
      response.statusCode = status;
      response.end(JSON.stringify(body));
    }
  );
  assert.equal(handled, true);
  assert.equal(res.statusCode, 403);
  assert.match(res.body, /ORIGIN_NOT_ALLOWED/);
  assert.equal(res.headers.get("cache-control"), "no-store, no-cache, must-revalidate, private");
  assert.equal(res.headers.get("pragma"), "no-cache");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
});

test("candidate auth route fails closed when durable auth is not configured", async () => {
  process.env.KINGSMEN_CANDIDATE_PORTAL_ORIGIN = "https://portal.example.test";
  const res = responseMock();
  const handled = await handleCandidateAuthRoute(
    requestMock("POST", "https://portal.example.test"), res.response,
    "/api/candidate-auth/login", null,
    (response, status, body) => {
      response.statusCode = status;
      response.end(JSON.stringify(body));
    }
  );
  assert.equal(handled, true);
  assert.equal(res.statusCode, 503);
  assert.match(res.body, /CANDIDATE_AUTH_NOT_CONFIGURED/);
  assert.equal(res.headers.get("cache-control"), "no-store, no-cache, must-revalidate, private");
});

test("candidate auth route enforces method and advertises the required method", async () => {
  const res = responseMock();
  const handled = await handleCandidateAuthRoute(
    requestMock("GET"), res.response,
    "/api/candidate-auth/login", null,
    (response, status, body) => {
      response.statusCode = status;
      response.end(JSON.stringify(body));
    }
  );
  assert.equal(handled, true);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.get("allow"), "POST");
});



function bodyRequestMock(body: string, contentType = "application/json") {
  const request = requestMock("POST", "https://portal.example.test") as IncomingMessage & AsyncIterable<Buffer>;
  request.headers = { origin: "https://portal.example.test", "content-type": contentType } as IncomingMessage["headers"];
  (request as unknown as { [Symbol.asyncIterator]: () => AsyncIterator<Buffer> })[Symbol.asyncIterator] = async function* () {
    yield Buffer.from(body);
  };
  return request;
}

test("candidate login rejects unsupported content types before credential verification", async () => {
  process.env.KINGSMEN_CANDIDATE_PORTAL_ORIGIN = "https://portal.example.test";
  let loginCalls = 0;
  const service = { login: async () => { loginCalls += 1; throw new Error("must not be called"); } } as unknown as CandidateAuthService;
  const res = responseMock();
  await handleCandidateAuthRoute(bodyRequestMock('{"email":"synthetic@example.test","password":"not-real"}', "text/plain"), res.response,
    "/api/candidate-auth/login", service,
    (response, status, body) => { response.statusCode = status; response.end(JSON.stringify(body)); });
  assert.equal(res.statusCode, 415);
  assert.match(res.body, /UNSUPPORTED_MEDIA_TYPE/);
  assert.equal(loginCalls, 0);
});

test("candidate login rejects malformed JSON before credential verification", async () => {
  process.env.KINGSMEN_CANDIDATE_PORTAL_ORIGIN = "https://portal.example.test";
  let loginCalls = 0;
  const service = { login: async () => { loginCalls += 1; throw new Error("must not be called"); } } as unknown as CandidateAuthService;
  const res = responseMock();
  await handleCandidateAuthRoute(bodyRequestMock('{"email":'), res.response,
    "/api/candidate-auth/login", service,
    (response, status, body) => { response.statusCode = status; response.end(JSON.stringify(body)); });
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /INVALID_JSON/);
  assert.equal(loginCalls, 0);
});

test("candidate login rejects oversized request bodies before credential verification", async () => {
  process.env.KINGSMEN_CANDIDATE_PORTAL_ORIGIN = "https://portal.example.test";
  let loginCalls = 0;
  const service = { login: async () => { loginCalls += 1; throw new Error("must not be called"); } } as unknown as CandidateAuthService;
  const res = responseMock();
  const oversized = "x".repeat(16_385);
  await handleCandidateAuthRoute(bodyRequestMock(oversized), res.response,
    "/api/candidate-auth/login", service,
    (response, status, body) => { response.statusCode = status; response.end(JSON.stringify(body)); });
  assert.equal(res.statusCode, 413);
  assert.match(res.body, /REQUEST_BODY_TOO_LARGE/);
  assert.equal(loginCalls, 0);
});

test("unrelated routes are not intercepted or given auth response headers", async () => {
  const res = responseMock();
  const handled = await handleCandidateAuthRoute(
    requestMock("GET"), res.response,
    "/api/candidate/profile", null,
    (response, status, body) => {
      response.statusCode = status;
      response.end(JSON.stringify(body));
    }
  );
  assert.equal(handled, false);
  assert.equal(res.headers.has("cache-control"), false);
  assert.equal(res.body, "");
});
