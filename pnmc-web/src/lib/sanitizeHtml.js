const DANGEROUS_TAGS_SELECTOR = 'script,style,iframe,object,embed,link,meta,base,form';
const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href']);

const sanitizeUrlAttribute = (value) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('javascript:') ? '#' : value;
};

export const sanitizeHtml = (rawHtml = '') => {
  if (typeof rawHtml !== 'string' || rawHtml.trim() === '') {
    return '';
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return rawHtml;
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
  });

  return documentNode.body.innerHTML;
};
