import { MODULE_TITLE } from "./constants.js";
import { logger } from "./logger.js";

export class FogPolicyError extends Error {
  constructor(code, message, { cause, details } = {}) {
    super(message, { cause });
    this.name = "FogPolicyError";
    this.code = code;
    this.details = details ?? null;
  }
}

export function describeError(error) {
  if (error instanceof FogPolicyError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      cause: error.cause
    };
  }

  return {
    code: "RFP-UNEXPECTED",
    message: error instanceof Error ? error.message : String(error),
    details: null,
    cause: error instanceof Error ? error.cause : null
  };
}

export function reportError(error, { context = "Operation", notify = true } = {}) {
  const described = describeError(error);
  logger.error(`${context} failed [${described.code}]: ${described.message}`, error);

  if (notify && globalThis.ui?.notifications) {
    ui.notifications.error(
      `${MODULE_TITLE}: ${context} failed (${described.code}). ${described.message}`,
      { permanent: true }
    );
  }

  return described;
}

export function requireGm(operation = "This operation") {
  if (!globalThis.game?.user?.isGM) {
    throw new FogPolicyError(
      "RFP-PERMISSION",
      `${operation} requires a GM or Assistant GM account.`
    );
  }
}
