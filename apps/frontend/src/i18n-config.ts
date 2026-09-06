export const i18n = {
    defaultLocale: 'en',
    locales: ['en', 'id', 'de', 'ja', 'nl'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const bcp47LocaleMap: Record<Locale, string> = {
    en: 'en-US',
    id: 'id-ID',
    de: 'de-DE',
    ja: 'ja-JP',
    nl: 'nl-NL',
};

export function getBcp47Locale(lang: string): string {
    return bcp47LocaleMap[lang as Locale] || 'en-US';
}
