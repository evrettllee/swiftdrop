import { expect, test } from '@playwright/test';
import { readAttachmentFilename } from './content-disposition';

test('should take the encoded name first', () => {
  expect(
    readAttachmentFilename(
      `attachment; filename="orders.csv"; filename*=UTF-8''${encodeURIComponent('заказы.csv')}`,
    ),
  ).toBe('заказы.csv');
});

test('should take the quoted or the plain name without an encoded one', () => {
  expect(readAttachmentFilename('attachment; filename="swiftdrop-orders-2026-11-02.xlsx"')).toBe(
    'swiftdrop-orders-2026-11-02.xlsx',
  );
  expect(readAttachmentFilename('attachment; filename=orders.csv')).toBe('orders.csv');
});

test('should drop the parts of a path and give nothing without a name', () => {
  expect(readAttachmentFilename('attachment; filename="../../etc/passwd"')).toBe('....etcpasswd');
  expect(readAttachmentFilename("attachment; filename*=UTF-8''%E0%A4%A")).toBeNull();
  expect(readAttachmentFilename('attachment')).toBeNull();
  expect(readAttachmentFilename(null)).toBeNull();
});
