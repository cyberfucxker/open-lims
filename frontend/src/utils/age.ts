interface AgeParts {
  years: number;
  months: number;
  days: number;
}

/** Approximates a DOB from a whole-years age — "today, N years ago" (not
 *  Jan 1 of the birth year) so `computeAge` immediately reads back as
 *  exactly `{years: N, months: 0, days: 0}` instead of drifting by however
 *  many months have passed since January. Used by the Age/DOB toggle in
 *  patient registration, where the front desk often only knows the age. */
export function ageToDob(years: number): string {
  const now = new Date();
  const dob = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
  const yyyy = dob.getFullYear();
  const mm = String(dob.getMonth() + 1).padStart(2, "0");
  const dd = String(dob.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Computes a Y/M/D age breakdown from an ISO date string, for display next to DOB. */
export function computeAge(dob: string): AgeParts | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  if (birth > now) return null;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}
