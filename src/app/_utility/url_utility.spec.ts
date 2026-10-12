import { validateUrl } from './url_utility';

// wish.url moet altijd een externe url zijn (sc-2577); legt het huidige gedrag vast (sc-2979).
describe('validateUrl', () => {
  it('laat een volledige http- of https-url ongemoeid', () => {
    expect(validateUrl('https://www.voorbeeld.be/a?b=1')).toBe('https://www.voorbeeld.be/a?b=1');
    expect(validateUrl('http://voorbeeld.be')).toBe('http://voorbeeld.be');
  });

  it('herkent het protocol ongeacht hoofdletters', () => {
    expect(validateUrl('HTTPS://Voorbeeld.be')).toBe('HTTPS://Voorbeeld.be');
  });

  it('laat ftp-urls ongemoeid', () => {
    expect(validateUrl('ftp://bestanden.be/x')).toBe('ftp://bestanden.be/x');
  });

  it('zet http:// voor een url zonder protocol, zodat hij niet relatief binnen Gimmi opent', () => {
    expect(validateUrl('www.voorbeeld.be')).toBe('http://www.voorbeeld.be');
  });

  it('vult een url die met :// begint aan tot http://', () => {
    expect(validateUrl('://voorbeeld.be')).toBe('http://voorbeeld.be');
  });

  it('haalt spaties weg, ook binnenin', () => {
    expect(validateUrl('  www.voor beeld.be  ')).toBe('http://www.voorbeeld.be');
  });

  it('decodeert url-gecodeerde tekens', () => {
    expect(validateUrl('https%3A%2F%2Fvoorbeeld.be%2Fa')).toBe('https://voorbeeld.be/a');
  });

  it('geeft zonder argument http:// terug', () => {
    expect(validateUrl()).toBe('http://');
  });
});
