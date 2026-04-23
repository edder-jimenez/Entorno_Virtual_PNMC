import {
  agendaRecordHasTag,
  buildAgendaItemFromRecord,
  buildNewsItemFromRecord,
  getNewsDateKeys,
  normalizeAgendaTags,
  parseAgendaTime,
} from './transforms.js';

describe('data transforms', () => {
  it('normaliza tags de agenda desde string y arreglos', () => {
    expect(normalizeAgendaTags('Festival, Taller | Formación')).toEqual(['Festival', 'Taller', 'Formación']);
    expect(normalizeAgendaTags(['A, B', 'C'])).toEqual(['A', 'B', 'C']);
  });

  it('convierte hora de agenda a minutos', () => {
    expect(parseAgendaTime('12:30 AM')).toBe(30);
    expect(parseAgendaTime('1:15 PM')).toBe(13 * 60 + 15);
  });

  it('filtra registros por tag ignorando mayúsculas', () => {
    const record = { fields: { Tags: 'Festival, Territorio' } };
    expect(agendaRecordHasTag(record, 'festival')).toBe(true);
    expect(agendaRecordHasTag(record, 'mercado')).toBe(false);
  });

  it('transforma registro de agenda a shape de UI', () => {
    const record = {
      id: 'rec-agenda',
      fields: {
        día: '09',
        mes: 'Marzo',
        año: '2026',
        time: '3:00 PM',
        t: 'Encuentro Territorial',
        l: 'Bogotá',
        cat: 'Festival',
        desc: 'Descripción',
      },
    };

    const item = buildAgendaItemFromRecord(record, 'fallback.jpg');

    expect(item.id).toBe('rec-agenda');
    expect(item.m).toBe('MAR');
    expect(item.timeValue).toBe(15 * 60);
    expect(item.img).toBe('fallback.jpg');
  });

  it('transforma registro de noticias con fallback de imagen', () => {
    const record = {
      id: 'rec-news',
      fields: {
        date: '14 de abril 2026',
        category: 'Actualidad',
        title: 'Título',
        desc: 'Resumen',
      },
    };

    const item = buildNewsItemFromRecord(record, 'fallback-news.jpg');
    expect(item.id).toBe('rec-news');
    expect(item.img).toBe('fallback-news.jpg');
  });

  it('normaliza fechas de noticias en distintos formatos', () => {
    expect(getNewsDateKeys('2026-04-14')).toEqual({ dateKey: '2026-04-14', monthKey: '2026-04' });
    expect(getNewsDateKeys('14/4/2026')).toEqual({ dateKey: '2026-04-14', monthKey: '2026-04' });
    expect(getNewsDateKeys('14 de abril de 2026')).toEqual({ dateKey: '2026-04-14', monthKey: '2026-04' });
  });
});
