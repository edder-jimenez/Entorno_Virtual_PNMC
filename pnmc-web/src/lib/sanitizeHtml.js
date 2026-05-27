const DANGEROUS_TAGS_SELECTOR = 'script,style,iframe,object,embed,link,meta,base,form';
const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href']);
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

const stripControlAndWhitespace = (value = '') => (
  [...value].filter((character) => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127 && !/\s/.test(character);
  }).join('')
);

const sanitizeUrlAttribute = (value) => {
  if (typeof value !== 'string') return '';
  const compactValue = stripControlAndWhitespace(value);
  const normalized = compactValue.toLowerCase();

  if (!normalized || normalized.startsWith('#') || normalized.startsWith('/')) {
    return value.trim();
  }

  try {
    const parsedUrl = new URL(compactValue, window.location.origin);
    return SAFE_URL_PROTOCOLS.has(parsedUrl.protocol) ? value.trim() : '#';
  } catch {
    return '#';
  }
};

export const sanitizeHtml = (rawHtml = '') => {
  if (typeof rawHtml !== 'string' || rawHtml.trim() === '') {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return '';
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(rawHtml, 'text/html');

  documentNode.querySelectorAll(DANGEROUS_TAGS_SELECTOR).forEach((node) => node.remove());

  documentNode.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const attrName = attribute.name.toLowerCase();

      if (attrName.startsWith('on')) {
        node.removeAttribute(attribute.name);
        return;
      }

      if (URL_ATTRIBUTES.has(attrName)) {
        node.setAttribute(attribute.name, sanitizeUrlAttribute(attribute.value));
      }
    });

    if (node.tagName?.toLowerCase() === 'a' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return documentNode.body.innerHTML;
};
