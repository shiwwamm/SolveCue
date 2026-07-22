export function toCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(date: Date, days: number): string {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return toCalendarDate(next);
}

export function schedulingDay(date: Date, rolloverHour: number): string {
  const shifted =
    date.getHours() < rolloverHour
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
      : new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return toCalendarDate(shifted);
}

export function nextCalendarDay(date: string): string {
  return addCalendarDays(parseCalendarDate(date), 1);
}

export function eachCalendarDay(
  startDate: string,
  endDate: string,
): string[] {
  const days: string[] = [];
  let current = startDate;

  while (current <= endDate) {
    days.push(current);
    current = addCalendarDays(parseCalendarDate(current), 1);
  }

  return days;
}

function parseCalendarDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}
