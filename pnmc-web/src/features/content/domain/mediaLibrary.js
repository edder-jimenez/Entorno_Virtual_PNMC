import {
  buildAgendaItemFromRecord as buildAgendaItemFromRecordBase,
  buildNewsItemFromRecord as buildNewsItemFromRecordBase,
} from '../../../services/data/index.js';

const MEDIA_LIBRARY = {
  homeHero: 'https://images.unsplash.com/photo-1774557482533-76b2ed54afce?q=80&w=1015&auto=format&fit=crop',
  performanceWide: 'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop',
  fieldworkWide: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
  cultureWide: 'https://images.unsplash.com/photo-1774558396250-1571cdddc61c?q=80&w=687&auto=format&fit=crop',
};

const HOME_HERO_IMAGES = [
  MEDIA_LIBRARY.homeHero,
  MEDIA_LIBRARY.performanceWide,
  MEDIA_LIBRARY.fieldworkWide,
  MEDIA_LIBRARY.cultureWide,
];

const buildAgendaItemFromRecord = (record) => (
  buildAgendaItemFromRecordBase(record, MEDIA_LIBRARY.fieldworkWide)
);

const buildNewsItemFromRecord = (record) => (
  buildNewsItemFromRecordBase(record, MEDIA_LIBRARY.fieldworkWide)
);

export {
  MEDIA_LIBRARY,
  HOME_HERO_IMAGES,
  buildAgendaItemFromRecord,
  buildNewsItemFromRecord,
};
