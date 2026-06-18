import 'server-only';
import type { Locale } from './i18n-config';

const dictionaries = {
    en: () => import('./dictionaries/en.json').then((module) => module.default),
    id: () => import('./dictionaries/id.json').then((module) => module.default),
    de: () => import('./dictionaries/de.json').then((module) => module.default),
    ja: () => import('./dictionaries/ja.json').then((module) => module.default),
    nl: () => import('./dictionaries/nl.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
    if (!dictionaries[locale]) {
        return dictionaries['en']();
    }
    return dictionaries[locale]();
};
