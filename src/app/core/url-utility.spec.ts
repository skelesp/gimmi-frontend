import { validateUrl } from './url-utility';

// wish.url must always be an external url (sc-2577); pins down the current behaviour (sc-2979).
describe('validateUrl', () => {
  it('laat een volledige http- of https-url ongemoeid', () => {
    expect(validateUrl('https://www.voorbeeld.be/a?b=1')).toBe('https://www.voorbeeld.be/a?b=1');
    expect(validateUrl('http://voorbeeld.be')).toBe('http://voorbeeld.be');
  });

  it('recognises the protocol regardless of capitals', () => {
    expect(validateUrl('HTTPS://Voorbeeld.be')).toBe('HTTPS://Voorbeeld.be');
  });

  it('laat ftp-urls ongemoeid', () => {
    expect(validateUrl('ftp://bestanden.be/x')).toBe('ftp://bestanden.be/x');
  });

  it('puts http:// before a url without protocol, so it does not open relative within Gimmi', () => {
    expect(validateUrl('www.voorbeeld.be')).toBe('http://www.voorbeeld.be');
  });

  it('completes a url that starts with :// to http://', () => {
    expect(validateUrl('://voorbeeld.be')).toBe('http://voorbeeld.be');
  });

  it('removes spaces, also inside', () => {
    expect(validateUrl('  www.voor beeld.be  ')).toBe('http://www.voorbeeld.be');
  });

  it('decodeert url-gecodeerde tekens', () => {
    expect(validateUrl('https%3A%2F%2Fvoorbeeld.be%2Fa')).toBe('https://voorbeeld.be/a');
  });

  it('returns http:// without an argument', () => {
    expect(validateUrl()).toBe('http://');
  });
});
