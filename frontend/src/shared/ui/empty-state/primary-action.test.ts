import { expect, test } from '@playwright/test';
import { PRIMARY_ACTION_PLACE, placePrimaryAction, primaryActionPlace } from './primary-action';

test('should hide the action while the list loads', () => {
  expect(primaryActionPlace({ isLoading: true, isEmpty: true })).toBe(PRIMARY_ACTION_PLACE.NONE);
});

test('should put the action into the empty state of an empty list', () => {
  expect(primaryActionPlace({ isLoading: false, isEmpty: true })).toBe(PRIMARY_ACTION_PLACE.EMPTY);
});

test('should keep the action in the header when the list has records', () => {
  expect(primaryActionPlace({ isLoading: false, isEmpty: false })).toBe(
    PRIMARY_ACTION_PLACE.HEADER,
  );
});

test('should keep the action in the header when the empty state has no action', () => {
  expect(primaryActionPlace({ isLoading: false, isEmpty: true, hasEmptyAction: false })).toBe(
    PRIMARY_ACTION_PLACE.HEADER,
  );
});

test('should give the action to one place only', () => {
  expect(placePrimaryAction('new', { isLoading: false, isEmpty: true })).toEqual({
    header: null,
    empty: 'new',
  });
  expect(placePrimaryAction('new', { isLoading: false, isEmpty: false })).toEqual({
    header: 'new',
    empty: null,
  });
});
