import { APP_LOCALE } from '@/shared/config';

const integerFormat = new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 0 });
const pluralRules = new Intl.PluralRules(APP_LOCALE);

export type PluralForms = {
  one: string;
  few: string;
  many: string;
};

export function formatCount(count: number): string {
  return integerFormat.format(count);
}

export function pluralize(count: number, forms: PluralForms): string {
  const category = pluralRules.select(count);

  if (category === 'one') {
    return forms.one;
  }

  return category === 'few' ? forms.few : forms.many;
}
