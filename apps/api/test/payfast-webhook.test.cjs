const test = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const { handlePayFastWebhook } = require("../dist/components/payfast-webhook.js");

function responseCapture() {
  return {
    statusCode: 200, headers: {}, body: "",
    setHeader(key, value) { this.headers[key] = value; },
    end(value = "") { this.body += value; }
  };
}

test("PayFast webhook rejects non-form content before parsing", async () => {
  const request = Object.assign(Readable.from(["{}"]), {
    url: "/api/webhooks/payfast/itn", method: "POST",
    headers: { "content-type": "application/json" }
  });
  const response = responseCapture();
  assert.equal(await handlePayFastWebhook(request, response), true);
  assert.equal(response.statusCode, 415);
  assert.equal(JSON.parse(response.body).code, "PAYFAST_FORM_CONTENT_TYPE_REQUIRED");
});

test("PayFast webhook is mounted only on its exact route", async () => {
  const request = Object.assign(Readable.from([""]), {
    url: "/api/webhooks/payfast/other", method: "POST", headers: {}
  });
  assert.equal(await handlePayFastWebhook(request, responseCapture()), false);
});

test("PayFast webhook requires POST", async () => {
  const request = Object.assign(Readable.from([""]), {
    url: "/api/webhooks/payfast/itn", method: "GET",
    headers: { "content-type": "application/x-www-form-urlencoded" }
  });
  const response = responseCapture();
  assert.equal(await handlePayFastWebhook(request, response), true);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "POST");
});
