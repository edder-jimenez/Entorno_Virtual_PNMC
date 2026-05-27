import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml.js';

describe('sanitizeHtml', () => {
  it('removes scripts, inline events, and javascript URLs', () => {
    const input = `
      <div onclick="alert('x')">
        <script>alert('xss')</script>
        <a href="javascript:alert('x')">click</a>
        <p>safe</p>
      </div>
    `;

    const output = sanitizeHtml(input);

    expect(output).not.toContain('<script');
    expect(output).not.toContain('onclick=');
    expect(output).not.toContain('javascript:');
    expect(output).toContain('<p>safe</p>');
  });

  it('blocks unsafe URL protocols and preserves safe links', () => {
    const output = sanitizeHtml(`
      <a href="java
      script:alert(1)">bad</a>
      <a href="data:text/html,alert(1)">data</a>
      <a href="https://example.org" target="_blank">safe</a>
    `);

    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('data:text/html');
    expect(output).toContain('href="https://example.org"');
    expect(output).toContain('rel="noopener noreferrer"');
  });
});
