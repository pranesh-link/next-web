import { round, findAndReplace, isInstanceOfPageLink, isInstanceOfPageLinkCollection, getApiUrl } from '../index';

describe('Common Utilities', () => {
  describe('round', () => {
    test('rounds number to specified precision', () => {
      expect(round(3.14159, 2)).toBe(3.14);
      expect(round(3.14159, 0)).toBe(3);
      expect(round(3.14159, 4)).toBe(3.1416);
    });

    test('handles negative numbers', () => {
      expect(round(-3.14159, 2)).toBe(-3.14);
    });

    test('handles zero precision', () => {
      expect(round(3.7, 0)).toBe(4);
    });
  });

  describe('findAndReplace', () => {
    test('replaces placeholders with provided values', () => {
      const template = 'Hello {0}, you have {1} messages';
      const result = findAndReplace(template, ['John', 5]);
      expect(result).toBe('Hello John, you have 5 messages');
    });

    test('handles empty string', () => {
      const result = findAndReplace('', []);
      expect(result).toBe('');
    });

    test('handles no placeholders', () => {
      const result = findAndReplace('Hello World', []);
      expect(result).toBe('Hello World');
    });

    test('replaces multiple occurrences', () => {
      const template = 'Redirecting in {0} seconds. Please wait {1} moments.';
      const result = findAndReplace(template, [5, 'a few']);
      expect(result).toBe('Redirecting in 5 seconds. Please wait a few moments.');
    });
  });

  describe('isInstanceOfPageLink', () => {
    test('returns true for valid PageLink object', () => {
      const pageLink = { route: '/home', label: 'Home' };
      expect(isInstanceOfPageLink(pageLink)).toBe(true);
    });

    test('returns false for non-PageLink object', () => {
      const notPageLink = { links: [] };
      expect(isInstanceOfPageLink(notPageLink)).toBe(false);
    });

    test('returns false for null', () => {
      expect(isInstanceOfPageLink(null)).toBe(false);
    });
  });

  describe('isInstanceOfPageLinkCollection', () => {
    test('returns true for valid PageLinkCollection object', () => {
      const collection = { links: [{ route: '/home', label: 'Home' }] };
      expect(isInstanceOfPageLinkCollection(collection)).toBe(true);
    });

    test('returns false for non-PageLinkCollection object', () => {
      const notCollection = { route: '/home' };
      expect(isInstanceOfPageLinkCollection(notCollection)).toBe(false);
    });

    test('returns false for null', () => {
      expect(isInstanceOfPageLinkCollection(null)).toBe(false);
    });
  });

  describe('getApiUrl', () => {
    test('returns correct API URL format', () => {
      expect(getApiUrl('profile')).toBe('/api/profile');
      expect(getApiUrl('config')).toBe('/api/config');
    });

    test('handles paths with leading slash', () => {
      expect(getApiUrl('/profile')).toBe('/api//profile');
    });

    test('handles empty path', () => {
      expect(getApiUrl('')).toBe('/api/');
    });
  });
});
