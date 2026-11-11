import { expect, test } from '@playwright/test';
import { PRIMARY_ACTION_PLACE, placePrimaryAction, primaryActionPlace } from './primary-action';

test('should hide the action while the list loads for the first time', () => {
  expect(primaryActionPlace({ isLoading: true, isEmpty: true })).toBe(PRIMARY_ACTION_PLACE.NONE);
});

test('should keep the settled place while the list loads again', () => {
  expect(primaryActionPlace({ isLoading: true, isEmpty: true }, PRIMARY_ACTION_PLACE.HEADER)).toBe(
    PRIMARY_ACTION_PLACE.HEADER,
  );
  expect(primaryActionPlace({ isLoading: true, isEmpty: false }, PRIMARY_ACTION_PLACE.EMPTY)).toBe(
    PRIMARY_ACTION_PLACE.EMPTY,
  );
});

test('should move the action once the new answer is in', () => {
  expect(primaryActionPlace({ isLoading: false, isEmpty: true }, PRIMARY_ACTION_PLACE.HEADER)).toBe(
    PRIMARY_ACTION_PLACE.EMPTY,
  );
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
  expect(placePrimaryAction('new', PRIMARY_ACTION_PLACE.EMPTY)).toEqual({
    header: null,
    empty: 'new',
  });
  expect(placePrimaryAction('new', PRIMARY_ACTION_PLACE.HEADER)).toEqual({
    header: 'new',
    empty: null,
  });
  expect(placePrimaryAction('new', PRIMARY_ACTION_PLACE.NONE)).toEqual({
    header: null,
    empty: null,
  });
});
