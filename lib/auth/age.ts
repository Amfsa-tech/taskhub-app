export const MINIMUM_SIGNUP_AGE = 18;

/** Calendar-age check matching TaskHub's 18+ Terms of Service. */
export function signupAge(value: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) {
    return null;
  }

  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1;
  }
  return age;
}

export function signupAgeError(value: string, today = new Date()): string | null {
  const age = signupAge(value, today);
  if (age === null) return 'Enter a valid date of birth as YYYY-MM-DD, e.g. 2002-04-15.';
  if (age < MINIMUM_SIGNUP_AGE) {
    return `You must be at least ${MINIMUM_SIGNUP_AGE} years old to register on TaskHub.`;
  }
  return null;
}
