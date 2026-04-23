export const AGENDA_SHORT_MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const AGENDA_MONTHS_MAP = {
  ENERO: 0,
  FEBRERO: 1,
  MARZO: 2,
  ABRIL: 3,
  MAYO: 4,
  JUNIO: 5,
  JULIO: 6,
  AGOSTO: 7,
  SEPTIEMBRE: 8,
  OCTUBRE: 9,
  NOVIEMBRE: 10,
  DICIEMBRE: 11,
};

export const parseAgendaTime = (timeStr) => {
  if (!timeStr) return 0;
  const [time = '0:00', modifier = 'AM'] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') hours = modifier === 'AM' ? '00' : '12';
  else if (modifier === 'PM') hours = parseInt(hours, 10) + 12;

  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
};

export const normalizeAgendaTags = (rawTags) => {
  if (Array.isArray(rawTags)) return rawTags.flatMap(normalizeAgendaTags);
  if (typeof rawTags !== 'string') return [];

  return rawTags
    .split(/[,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const agendaRecordHasTag = (record, targetTag) => {
  if (!targetTag) return true;
  const tags = normalizeAgendaTags(record?.fields?.Tags);
  return tags.some((tag) => tag.toLowerCase() === targetTag.toLowerCase());
};

export const buildAgendaItemFromRecord = (record, fallbackImage = '') => {
  const dayValue = record.fields.día || '01';
  const monthText = (record.fields.mes || 'Enero').toUpperCase();
  const yearValue = record.fields.año || '2026';
  const timeValue = record.fields.time || '';
  const exactLocation = record.fields.l || record.fields.lugar || record.fields.Lugar || '';
  const municipality = record.fields.municipio || record.fields.Municipio || record.fields.ciudad || record.fields.Ciudad || '';
  const department = record.fields.departamento || record.fields.Departamento || record.fields.dpto || record.fields.dpt || '';
  const municipalityCode = record.fields.municipalityCode || record.fields.MunicipalityCode || record.fields.divipola || '';
  const departmentCode = record.fields.departmentCode || record.fields.DepartmentCode || record.fields.dpto_ccdgo || '';
  const shortLocation = [municipality, department].filter(Boolean).join(', ') || exactLocation;

  const monthIndex = AGENDA_MONTHS_MAP[monthText] ?? 0;
  const dateObj = new Date(parseInt(yearValue, 10), monthIndex, parseInt(dayValue, 10));
  const monthAbbr = AGENDA_SHORT_MONTHS[monthIndex] || 'ENE';

  return {
    id: record.id,
    d: dayValue.toString().padStart(2, '0'),
    m: monthAbbr,
    y: yearValue,
    dateObj,
    timeValue: parseAgendaTime(timeValue),
    t: record.fields.t || '',
    l: shortLocation,
    exactLocation,
    municipality,
    department,
    municipalityCode,
    departmentCode,
    cat: record.fields.cat || '',
    desc: record.fields.desc || '',
    time: timeValue,
    organizer: record.fields.organizer || '',
    link: record.fields.link || '#',
    img: record.fields.img || fallbackImage,
    tags: normalizeAgendaTags(record.fields.Tags),
  };
};

export const NEWS_MONTHS_MAP = {
  ENE: '01',
  ENERO: '01',
  FEB: '02',
  FEBRERO: '02',
  MAR: '03',
  MARZO: '03',
  ABR: '04',
  ABRIL: '04',
  MAY: '05',
  MAYO: '05',
  JUN: '06',
  JUNIO: '06',
  JUL: '07',
  JULIO: '07',
  AGO: '08',
  AGOSTO: '08',
  SEP: '09',
  SEPT: '09',
  SEPTIEMBRE: '09',
  SET: '09',
  SETIEMBRE: '09',
  OCT: '10',
  OCTUBRE: '10',
  NOV: '11',
  NOVIEMBRE: '11',
  DIC: '12',
  DICIEMBRE: '12',
};

export const getNewsDateKeys = (dateText = '') => {
  const normalizedDate = dateText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  const isoMatch = normalizedDate.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const monthKey = `${year}-${month.padStart(2, '0')}`;
    return { dateKey: `${monthKey}-${day.padStart(2, '0')}`, monthKey };
  }

  const numericMatch = normalizedDate.match(/(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?/);
  if (numericMatch) {
    const [, day, month, rawYear] = numericMatch;
    const year = rawYear ? rawYear.padStart(4, '20') : '2026';
    const monthKey = `${year}-${month.padStart(2, '0')}`;
    return { dateKey: `${monthKey}-${day.padStart(2, '0')}`, monthKey };
  }

  const dayMonthMatch = normalizedDate.match(/(\d{1,2})\s*(?:DE\s*)?([A-Z]+)(?:\s*(?:DE\s*)?(\d{2,4}))?/);
  if (dayMonthMatch) {
    const [, day, monthText, rawYear] = dayMonthMatch;
    const month = NEWS_MONTHS_MAP[monthText];
    if (!month) return null;
    const year = rawYear ? rawYear.padStart(4, '20') : '2026';
    const monthKey = `${year}-${month}`;
    return { dateKey: `${monthKey}-${day.padStart(2, '0')}`, monthKey };
  }

  const monthDayMatch = normalizedDate.match(/([A-Z]+)\s*(\d{1,2})(?:\s*(?:DE\s*)?(\d{2,4}))?/);
  if (monthDayMatch) {
    const [, monthText, day, rawYear] = monthDayMatch;
    const month = NEWS_MONTHS_MAP[monthText];
    if (!month) return null;
    const year = rawYear ? rawYear.padStart(4, '20') : '2026';
    const monthKey = `${year}-${month}`;
    return { dateKey: `${monthKey}-${day.padStart(2, '0')}`, monthKey };
  }

  return null;
};

export const buildNewsItemFromRecord = (record, fallbackImage = '') => ({
  id: record.id,
  date: record.fields.date || '',
  category: record.fields.category || '',
  title: record.fields.title || '',
  desc: record.fields.desc || '',
  img: record.fields.img || fallbackImage,
  content: record.fields.content || '',
});
