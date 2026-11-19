import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('should escape every special character when a value holds markup', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('should keep the text as it is when there is nothing to escape', () => {
    expect(escapeHtml('Иван Петров')).toBe('Иван Петров');
  });
});
