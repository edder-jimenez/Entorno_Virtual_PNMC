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
});
