import type { PortalHealthStatus } from "./route-types";

export interface PortalHealthInput {
  httpStatus?: number;
  otpDetected?: boolean;
  captchaDetected?: boolean;
  manualOnlyDetected?: boolean;
  downDetected?: boolean;
}

export interface PortalHealthDecision {
  status: PortalHealthStatus;
  mapFallbackRequired: boolean;
  reasonCode?: "OTP_REQUIRED" | "CAPTCHA_BLOCKED" | "PORTAL_DOWN" | "MANUAL_ONLY";
  message: string;
}

export function evaluatePortalHealth(input: PortalHealthInput): PortalHealthDecision {
  if (input.otpDetected) {
    return {
      status: "OTP_REQUIRED",
      mapFallbackRequired: true,
      reasonCode: "OTP_REQUIRED",
      message: "OTP required. Route to Manual Application Package fallback."
    };
  }

  if (input.captchaDetected) {
    return {
      status: "CAPTCHA_BLOCKED",
      mapFallbackRequired: true,
      reasonCode: "CAPTCHA_BLOCKED",
      message: "CAPTCHA detected. Route to Manual Application Package fallback."
    };
  }

  if (input.manualOnlyDetected) {
    return {
      status: "MANUAL_ONLY",
      mapFallbackRequired: true,
      reasonCode: "MANUAL_ONLY",
      message: "Portal is manual-only. Route to Manual Application Package fallback."
    };
  }

  if (input.downDetected || (input.httpStatus !== undefined && input.httpStatus >= 500)) {
    return {
      status: "DOWN",
      mapFallbackRequired: true,
      reasonCode: "PORTAL_DOWN",
      message: "Portal appears down. Route to Manual Application Package fallback."
    };
  }

  if (input.httpStatus !== undefined && input.httpStatus >= 200 && input.httpStatus < 400) {
    return {
      status: "OPEN",
      mapFallbackRequired: false,
      message: "Portal appears open."
    };
  }

  return {
    status: "UNKNOWN",
    mapFallbackRequired: false,
    message: "Portal health is unknown and should be checked before execution."
  };
}