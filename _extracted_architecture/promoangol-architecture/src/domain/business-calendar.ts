export function addWorkingDays(start: Date, workingDays: number, holidays = new Set<string>()): Date {
  const result = new Date(start);
  result.setUTCHours(0, 0, 0, 0);
  let remaining = workingDays;

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    const dateKey = result.toISOString().slice(0, 10);
    const weekend = day === 0 || day === 6;
    if (!weekend && !holidays.has(dateKey)) remaining -= 1;
  }

  return result;
}

export function membershipRewardExpiry(joinDate: Date): Date {
  const expiry = new Date(joinDate);
  expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
  expiry.setUTCHours(0, 0, 0, 0);
  return expiry;
}
