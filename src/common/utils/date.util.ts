import type { Dayjs } from 'dayjs';
// eslint-disable-next-line no-duplicate-imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export { dayjs };

/**
 * Parse a time string (HH:mm) to a dayjs object with a specific date
 */
export function parseTimeWithDate(date: Date | string, time: string): Dayjs {
  const [hours, minutes] = time.split(':').map(Number);
  return dayjs(date).hour(hours).minute(minutes).second(0).millisecond(0);
}

/**
 * Check if two time slots overlap
 */
export function hasTimeOverlap(
  slot1Start: string,
  slot1End: string,
  slot2Start: string,
  slot2End: string
): boolean {
  const s1Start = parseTimeToMinutes(slot1Start);
  const s1End = parseTimeToMinutes(slot1End);
  const s2Start = parseTimeToMinutes(slot2Start);
  const s2End = parseTimeToMinutes(slot2End);

  return s1Start < s2End && s1End > s2Start;
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:mm)
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get the start and end of a day
 */
export function getDayBounds(date: Date | string): { start: Date; end: Date } {
  const d = dayjs(date);
  return {
    start: d.startOf('day').toDate(),
    end: d.endOf('day').toDate(),
  };
}

/**
 * Get the start and end of a week
 */
export function getWeekBounds(date: Date | string): { start: Date; end: Date } {
  const d = dayjs(date);
  return {
    start: d.startOf('week').toDate(),
    end: d.endOf('week').toDate(),
  };
}

/**
 * Get the start and end of a month
 */
export function getMonthBounds(date: Date | string): { start: Date; end: Date } {
  const d = dayjs(date);
  return {
    start: d.startOf('month').toDate(),
    end: d.endOf('month').toDate(),
  };
}

/**
 * Calculate the difference in hours between two dates
 */
export function hoursDifference(date1: Date, date2: Date): number {
  return Math.abs(dayjs(date2).diff(dayjs(date1), 'hour'));
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  return dayjs(date).isBefore(dayjs());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  return dayjs(date).isAfter(dayjs());
}

/**
 * Check if a date is within a range
 */
export function isWithinRange(
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  return dayjs(date).isBetween(dayjs(start), dayjs(end), null, '[]');
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, format = 'DD/MM/YYYY'): string {
  return dayjs(date).format(format);
}

/**
 * Format a time for display
 */
export function formatTime(date: Date | string, format = 'HH:mm'): string {
  return dayjs(date).format(format);
}

/**
 * Get day of week name from date
 */
export function getDayOfWeek(date: Date | string): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayjs(date).day()];
}

/**
 * Generate dates between two dates
 */
export function* generateDateRange(start: Date | string, end: Date | string): Generator<Date> {
  let current = dayjs(start);
  const endDate = dayjs(end);

  while (current.isSameOrBefore(endDate, 'day')) {
    yield current.toDate();
    current = current.add(1, 'day');
  }
}
