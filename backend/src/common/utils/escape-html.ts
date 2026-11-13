const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_SPECIAL_CHARACTERS = /[&<>"']/g;

export function escapeHtml(value: string): string {
  return value.replace(HTML_SPECIAL_CHARACTERS, (character) => HTML_ENTITIES[character]);
}
