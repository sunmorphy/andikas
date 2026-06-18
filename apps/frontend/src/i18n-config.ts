export const i18n = {
    defaultLocale: 'en',
    locales: ['en', 'id', 'de', 'ja', 'nl'],
} as const;

export type Locale = (typeof i18n)['locales'][number];
