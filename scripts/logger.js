import { MODULE_TITLE } from "./constants.js";

const PREFIX = `[${MODULE_TITLE}]`;

export const logger = Object.freeze({
  debug(...args) {
    console.debug(PREFIX, ...args);
  },
  info(...args) {
    console.info(PREFIX, ...args);
  },
  warn(...args) {
    console.warn(PREFIX, ...args);
  },
  error(...args) {
    console.error(PREFIX, ...args);
  }
});
