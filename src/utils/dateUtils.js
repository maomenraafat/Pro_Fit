import moment from "moment-timezone";

// This function returns the date as a string formatted to Cairo time, including the timezone offset.
function toCairoTimeString(date) {
  return moment.tz(date, "Africa/Cairo").format("YYYY-MM-DDTHH:mm:ss.SSSZ"); // 'Z' includes timezone offset
}

// This function returns a JavaScript Date object adjusted to Cairo time.
function toCairoDate(date) {
  return moment.tz(date, "Africa/Cairo").toDate(); // Convert to Date object in local time
}

export { toCairoTimeString, toCairoDate };
