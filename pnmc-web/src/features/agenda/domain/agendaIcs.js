const ICS_MONTH_INDEX = {
  ENE: 0,
  FEB: 1,
  MAR: 2,
  ABR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DIC: 11,
};

const escapeIcsText = (value = '') => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

const formatIcsDateTime = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
};

const formatIcsDate = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
};

const buildAgendaEventIcs = (item) => {
  const year = parseInt(item.y, 10);
  const monthIndex = ICS_MONTH_INDEX[item.m] ?? 0;
  const day = parseInt(item.d, 10);
  const nowStamp = formatIcsDateTime(new Date());
  const summary = escapeIcsText(item.t);
  const description = escapeIcsText(
    [item.desc, item.organizer ? `Organiza: ${item.organizer}` : '', item.link && item.link !== '#' ? `Más información: ${item.link}` : '']
      .filter(Boolean)
      .join('\n')
  );
  const location = escapeIcsText(item.exactLocation ? `${item.exactLocation}, Colombia` : item.l ? `${item.l}, Colombia` : 'Colombia');
  const uid = `${item.id || `${item.t}-${item.d}-${item.m}-${item.y}`.replace(/\s+/g, '-')}@pnmc-web`;
  const timeMatch = item.time?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

  if (!timeMatch) {
    const startDate = new Date(year, monthIndex, day);
    const endDate = new Date(year, monthIndex, day + 1);
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PNMC//Agenda//ES',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${formatIcsDate(startDate)}`,
      `DTEND;VALUE=DATE:${formatIcsDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const modifier = timeMatch[3].toUpperCase();
  if (hours === 12) hours = modifier === 'AM' ? 0 : 12;
  else if (modifier === 'PM') hours += 12;

  const startDate = new Date(year, monthIndex, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PNMC//Agenda//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${formatIcsDateTime(startDate)}`,
    `DTEND:${formatIcsDateTime(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

export {
  buildAgendaEventIcs,
};
