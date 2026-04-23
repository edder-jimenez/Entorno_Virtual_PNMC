import {
  BookOpen,
  Boxes,
  Building2,
  Disc,
  FileVideo,
  Info,
  Landmark,
  Library,
  Music2,
  Search,
} from 'lucide-react';

const NEWS_MONTH_FILTER_OPTIONS = [
  { value: '2026-01', label: 'Enero' },
  { value: '2026-02', label: 'Febrero' },
  { value: '2026-03', label: 'Marzo' },
  { value: '2026-04', label: 'Abril' },
  { value: '2026-05', label: 'Mayo' },
  { value: '2026-06', label: 'Junio' },
  { value: '2026-07', label: 'Julio' },
  { value: '2026-08', label: 'Agosto' },
  { value: '2026-09', label: 'Septiembre' },
  { value: '2026-10', label: 'Octubre' },
  { value: '2026-11', label: 'Noviembre' },
  { value: '2026-12', label: 'Diciembre' },
];

const splitHeroHeadline = (headline = '') => {
  const normalizedHeadline = headline.trim();
  const words = normalizedHeadline.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return { title: normalizedHeadline, titleAccent: '' };
  }

  let bestSplitIndex = 1;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(' ');
    const right = words.slice(index).join(' ');
    const difference = Math.abs(left.length - right.length);

    if (difference < bestDifference) {
      bestDifference = difference;
      bestSplitIndex = index;
    }
  }

  return {
    title: words.slice(0, bestSplitIndex).join(' '),
    titleAccent: words.slice(bestSplitIndex).join(' '),
  };
};

const getEditorialSectionIcon = (section = '') => {
  const normalizedSection = section.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  if (normalizedSection.includes('FORMACION')) return BookOpen;
  if (normalizedSection.includes('REPERTORIO')) return Disc;
  if (normalizedSection.includes('INVESTIGACION')) return Search;
  if (normalizedSection.includes('CREACION') || normalizedSection.includes('CIRCULACION')) return Music2;
  if (normalizedSection.includes('PRODUCCION') || normalizedSection.includes('EMPRENDIMIENTO')) return Boxes;
  if (normalizedSection.includes('DIVULGACION')) return FileVideo;
  if (normalizedSection.includes('DOTACION') || normalizedSection.includes('INFRAESTRUCTURA')) return Building2;
  if (normalizedSection.includes('INFORMACION')) return Info;
  if (normalizedSection.includes('GESTION')) return Landmark;
  return Library;
};

const extractEditorialYears = (rawYearValue = '') => {
  const yearText = String(rawYearValue || '');
  const matches = [...yearText.matchAll(/\b(19|20)\d{2}\b/g)]
    .map((match) => parseInt(match[0], 10))
    .filter((year) => Number.isFinite(year));

  if (matches.length === 0) return [];

  const extractedYears = [];

  for (let index = 0; index < matches.length; index += 1) {
    const currentYear = matches[index];
    const nextYear = matches[index + 1];

    if (nextYear) {
      const currentPosition = yearText.indexOf(String(currentYear));
      const nextPosition = yearText.indexOf(String(nextYear), currentPosition + 4);
      const betweenText = nextPosition > currentPosition ? yearText.slice(currentPosition + 4, nextPosition) : '';
      const isRange = /[-–—]/.test(betweenText) && nextYear >= currentYear && nextYear - currentYear <= 10;

      if (isRange) {
        for (let year = currentYear; year <= nextYear; year += 1) {
          extractedYears.push(year);
        }
        index += 1;
        continue;
      }
    }

    extractedYears.push(currentYear);
  }

  return [...new Set(extractedYears)].sort((left, right) => left - right);
};

export {
  NEWS_MONTH_FILTER_OPTIONS,
  splitHeroHeadline,
  getEditorialSectionIcon,
  extractEditorialYears,
};
