/** Formats a backend "HH:mm" 24-hour string as a 12-hour clock label, e.g. "08:00" -> "8:00 AM". */
export function to12Hour(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr} ${period}`;
}
