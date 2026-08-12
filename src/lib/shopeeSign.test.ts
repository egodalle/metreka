import { describe, expect, it } from 'vitest';
import {
  parseShopeeCredentials,
  shopeeShopSign,
} from '../../supabase/functions/_shared/shopee';

describe('Shopee credential helpers', () => {
  it('rejects incomplete credentials', () => {
    expect(parseShopeeCredentials(null)).toBeNull();
    expect(parseShopeeCredentials({ partnerId: '1' })).toBeNull();
  });

  it('parses and trims required fields', () => {
    expect(
      parseShopeeCredentials({
        partnerId: ' 111 ',
        partnerKey: ' key ',
        shopId: ' 222 ',
        accessToken: ' tok ',
      }),
    ).toEqual({
      partnerId: '111',
      partnerKey: 'key',
      shopId: '222',
      accessToken: 'tok',
    });
  });

  it('produces a stable HMAC-SHA256 hex signature', async () => {
    const sign = await shopeeShopSign(
      'testpartnerkey',
      '10001',
      '/api/v2/shop/get_shop_info',
      1700000000,
      'access-token',
      '20002',
    );
    expect(sign).toMatch(/^[a-f0-9]{64}$/);

    const again = await shopeeShopSign(
      'testpartnerkey',
      '10001',
      '/api/v2/shop/get_shop_info',
      1700000000,
      'access-token',
      '20002',
    );
    expect(again).toBe(sign);
  });
});
