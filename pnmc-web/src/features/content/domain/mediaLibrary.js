import {
  buildAgendaItemFromRecord as buildAgendaItemFromRecordBase,
  buildNewsItemFromRecord as buildNewsItemFromRecordBase,
} from '../../../services/data/index.js';

const RANDOM_GALLERY_IMAGES = [
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/Portada.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581114.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581128.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581143.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581161.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581179.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581216.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581255.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581278.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581320.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581357.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757622581384.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757624083659.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757631027664.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757631027922.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757776744366.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757776744860.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757776745025.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757778375972.jpg'
];

const ORIGINAL_MEDIA_LIBRARY = {
  homeHero: 'https://images.unsplash.com/photo-1774557482533-76b2ed54afce?q=80&w=1015&auto=format&fit=crop',
  performanceWide: 'https://images.unsplash.com/photo-1774558396280-c14b21198674?q=80&w=1470&auto=format&fit=crop',
  fieldworkWide: 'https://images.unsplash.com/photo-1774558396253-be05d7a37d82?q=80&w=1470&auto=format&fit=crop',
  cultureWide: 'https://images.unsplash.com/photo-1774558396250-1571cdddc61c?q=80&w=687&auto=format&fit=crop',
};

const MEDIA_LIBRARY = { ...ORIGINAL_MEDIA_LIBRARY };

const HOME_HERO_IMAGES = [
  MEDIA_LIBRARY.homeHero,
  MEDIA_LIBRARY.performanceWide,
  MEDIA_LIBRARY.fieldworkWide,
  MEDIA_LIBRARY.cultureWide,
];

const NEWS_GALLERY_IMAGES = [
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(1).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(2).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(3).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(4).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(5).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(6).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(7).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(8).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(9).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(10).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(11).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(12).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(13).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(14).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(15).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(16).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(17).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(18).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(19).jpeg',
  '/Galeria/Mesa%20Nacional%20de%20Rock%20-%20Instalaci%C3%B3n/WhatsApp%20Image%202026-04-07%20at%2011.32.36%20(20).jpeg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939720.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939735.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939753.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939769.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939785.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939800.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939816.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939833.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939849.jpg',
  '/Galeria/Congreso%20Nacional%20de%20M%C3%BAsica/1757878939866.jpg'
];

const getRandomImage = (id = '') => {
  const index = String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % NEWS_GALLERY_IMAGES.length;
  return NEWS_GALLERY_IMAGES[index];
};

const buildAgendaItemFromRecord = (record) => {
  const mapped = buildAgendaItemFromRecordBase(record, getRandomImage(record?.id));
  if (!mapped.img || !mapped.img.startsWith('/Galeria/')) {
    mapped.img = getRandomImage(record?.id);
  }
  return mapped;
};

const buildNewsItemFromRecord = (record) => {
  const mapped = buildNewsItemFromRecordBase(record, getRandomImage(record?.id));
  if (!mapped.img || !mapped.img.startsWith('/Galeria/')) {
    mapped.img = getRandomImage(record?.id);
  }
  return mapped;
};

const HOME_BANNER_IMAGES = [
  RANDOM_GALLERY_IMAGES[0],
  RANDOM_GALLERY_IMAGES[1],
  RANDOM_GALLERY_IMAGES[3]
];

export {
  MEDIA_LIBRARY,
  HOME_HERO_IMAGES,
  RANDOM_GALLERY_IMAGES,
  HOME_BANNER_IMAGES,
  buildAgendaItemFromRecord,
  buildNewsItemFromRecord,
};
