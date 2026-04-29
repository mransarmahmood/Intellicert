import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a', 'b', 'strong', 'i', 'em', 'u', 's', 'br', 'p', 'span', 'div',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'sup', 'sub', 'hr', 'img',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height'];

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}

export function safeHtml(input: string | null | undefined) {
  return { __html: sanitizeHtml(input) };
}
