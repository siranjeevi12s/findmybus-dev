/**
 * Dev-only logging helper for the structured backend traces
 * ([SOCKET][BACKEND], [GPS][BACKEND], [HTTP][BACKEND]).
 *
 * With NODE_ENV=production these are silent, so Azure logs never carry
 * per-event tracking output or coordinate telemetry. Real errors
 * (auth rejections, io-unavailable breakage, crashes) keep using
 * console.warn/console.error directly — those messages contain no
 * coordinates and no tokens.
 */
const DEBUG = process.env.NODE_ENV !== 'production';

module.exports = {
  debugLog: (...a) => {
    if (DEBUG) console.log(...a);
  },
};
