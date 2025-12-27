import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encodeFormStack,
  decodeFormStack,
  buildFormStackUrl,
  parseFormStackUrl,
} from '../urlEncoding';

describe('encodeFormStack', () => {
  it('should return empty string for empty array', () => {
    expect(encodeFormStack([])).toBe('');
  });

  it('should encode single form ID', () => {
    expect(encodeFormStack(['org-form'])).toBe('org-form');
  });

  it('should encode multiple form IDs as comma-separated', () => {
    expect(encodeFormStack(['org-form', 'team-form'])).toBe('org-form,team-form');
  });

  it('should encode three or more form IDs', () => {
    expect(encodeFormStack(['form-1', 'form-2', 'form-3'])).toBe(
      'form-1,form-2,form-3'
    );
  });

  it('should URL-encode special characters', () => {
    expect(encodeFormStack(['form with spaces', 'form&special'])).toBe(
      'form%20with%20spaces,form%26special'
    );
  });

  it('should URL-encode equals signs', () => {
    expect(encodeFormStack(['form=value'])).toBe('form%3Dvalue');
  });

  it('should URL-encode question marks', () => {
    expect(encodeFormStack(['form?query'])).toBe('form%3Fquery');
  });

  it('should URL-encode hash symbols', () => {
    expect(encodeFormStack(['form#anchor'])).toBe('form%23anchor');
  });

  it('should handle readonly arrays', () => {
    const readonlyArray: readonly string[] = ['org-form', 'team-form'];
    expect(encodeFormStack(readonlyArray)).toBe('org-form,team-form');
  });
});

describe('decodeFormStack', () => {
  it('should return empty array for null', () => {
    expect(decodeFormStack(null)).toEqual([]);
  });

  it('should return empty array for undefined', () => {
    expect(decodeFormStack(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(decodeFormStack('')).toEqual([]);
  });

  it('should return empty array for whitespace-only string', () => {
    expect(decodeFormStack('   ')).toEqual([]);
  });

  it('should decode single form ID', () => {
    expect(decodeFormStack('org-form')).toEqual(['org-form']);
  });

  it('should decode comma-separated form IDs', () => {
    expect(decodeFormStack('org-form,team-form')).toEqual([
      'org-form',
      'team-form',
    ]);
  });

  it('should decode three or more form IDs', () => {
    expect(decodeFormStack('form-1,form-2,form-3')).toEqual([
      'form-1',
      'form-2',
      'form-3',
    ]);
  });

  it('should decode URL-encoded special characters', () => {
    expect(decodeFormStack('form%20with%20spaces,form%26special')).toEqual([
      'form with spaces',
      'form&special',
    ]);
  });

  it('should handle invalid encoding gracefully', () => {
    expect(decodeFormStack('%ZZ%invalid')).toEqual([]);
  });

  it('should filter out empty segments from trailing commas', () => {
    expect(decodeFormStack('form-1,')).toEqual(['form-1']);
  });

  it('should filter out empty segments from leading commas', () => {
    expect(decodeFormStack(',form-1')).toEqual(['form-1']);
  });

  it('should filter out empty segments from double commas', () => {
    expect(decodeFormStack('form-1,,form-2')).toEqual(['form-1', 'form-2']);
  });

  it('should trim whitespace from IDs', () => {
    expect(decodeFormStack(' form-1 , form-2 ')).toEqual(['form-1', 'form-2']);
  });
});

describe('encodeFormStack and decodeFormStack round-trip', () => {
  it('should preserve data through encode/decode cycle', () => {
    const original = ['org-form', 'team-form', 'project-form'];
    const encoded = encodeFormStack(original);
    const decoded = decodeFormStack(encoded);
    expect(decoded).toEqual(original);
  });

  it('should preserve special characters through encode/decode cycle', () => {
    const original = ['form with spaces', 'form&special', 'form=value?query#hash'];
    const encoded = encodeFormStack(original);
    const decoded = decodeFormStack(encoded);
    expect(decoded).toEqual(original);
  });

  it('should preserve empty array through encode/decode cycle', () => {
    const original: string[] = [];
    const encoded = encodeFormStack(original);
    const decoded = decodeFormStack(encoded);
    expect(decoded).toEqual(original);
  });

  it('should preserve unicode characters through encode/decode cycle', () => {
    const original = ['form-日本語', 'form-한국어', 'form-中文'];
    const encoded = encodeFormStack(original);
    const decoded = decodeFormStack(encoded);
    expect(decoded).toEqual(original);
  });
});

describe('buildFormStackUrl', () => {
  const originalLocation = window.location;
  const mockHref = 'http://localhost/app?existing=value';

  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: mockHref,
        search: '?existing=value',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('should add forms param to URL', () => {
    const result = buildFormStackUrl(['org-form', 'team-form']);
    expect(result).toContain('forms=org-form%2Cteam-form');
  });

  it('should preserve existing query parameters', () => {
    const result = buildFormStackUrl(['org-form']);
    expect(result).toContain('existing=value');
    expect(result).toContain('forms=org-form');
  });

  it('should remove forms param when stack is empty', () => {
    const result = buildFormStackUrl([]);
    expect(result).toContain('existing=value');
    expect(result).not.toContain('forms=');
  });

  it('should use custom param name', () => {
    const result = buildFormStackUrl(['form-1'], 'customStack');
    expect(result).toContain('customStack=form-1');
    expect(result).not.toContain('forms=');
  });
});

describe('parseFormStackUrl', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('should parse form IDs from URL', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?forms=org-form,team-form',
      },
      writable: true,
      configurable: true,
    });
    expect(parseFormStackUrl()).toEqual(['org-form', 'team-form']);
  });

  it('should return empty array when param is not present', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?other=value',
      },
      writable: true,
      configurable: true,
    });
    expect(parseFormStackUrl()).toEqual([]);
  });

  it('should use custom param name', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?customStack=form-1,form-2',
      },
      writable: true,
      configurable: true,
    });
    expect(parseFormStackUrl('customStack')).toEqual(['form-1', 'form-2']);
  });

  it('should handle empty query string', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
      },
      writable: true,
      configurable: true,
    });
    expect(parseFormStackUrl()).toEqual([]);
  });

  it('should decode URL-encoded form IDs from URL', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?forms=form%20with%20spaces,form%26special',
      },
      writable: true,
      configurable: true,
    });
    expect(parseFormStackUrl()).toEqual(['form with spaces', 'form&special']);
  });
});
