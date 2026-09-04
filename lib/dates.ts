const noon = (isoDate: string) => new Date(`${isoDate}T12:00:00`);

export function formatGregorian(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    calendar: "gregory",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(noon(isoDate));
}

export function formatHijri(isoDate: string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(noon(isoDate));
}

export function formatBothCalendars(isoDate: string) {
  return {
    gregorian: formatGregorian(isoDate),
    hijri: formatHijri(isoDate),
  };
}
