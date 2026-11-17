import { apiWish } from './wish.testing';
import { canDo, hasRole, wishUrl } from './wish';

describe('wish helpers', () => {
  describe('wishUrl', () => {
    it('is the first link, as an absolute address', () => {
      expect(wishUrl(apiWish({ links: [{ url: 'www.voorbeeld.be/product' }, { url: 'https://twee.be' }] }))).toBe('http://www.voorbeeld.be/product');
    });

    it('is null without links', () => {
      expect(wishUrl(apiWish({ links: [] }))).toBeNull();
    });
  });

  it('roles and permissions come from the server, not from id comparison', () => {
    const wish = apiWish({ viewer: { roles: ['receiver', 'creator'], can: { update: true, delete: true, copy: false, reserve: false, unreserve: false, fulfill: true, unfulfill: false } } });
    expect([hasRole(wish, 'receiver'), hasRole(wish, 'creator'), hasRole(wish, 'giver')]).toEqual([true, true, false]);
    expect([canDo(wish, 'update'), canDo(wish, 'delete'), canDo(wish, 'copy')]).toEqual([true, true, false]);
    expect(hasRole(apiWish({ viewer: { roles: ['giver'] } }), 'giver')).toBe(true);
  });
});
