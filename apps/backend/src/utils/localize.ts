/**
 * Deeply maps over an object or array. If it encounters it an object that 
 * roughly matches the localization schema (e.g. has an `en` key with a string),
 * it returns just the requested localized string or falls back to English.
 */
export function localizeData(data: any, lang?: string): any {
    if (data === null || data === undefined) return data;

    // Handle stringified JSON that might be localization objects (e.g. from varchar columns)
    if (typeof data === 'string' && data.startsWith('{') && data.endsWith('}')) {
        try {
            const parsed = JSON.parse(data);
            if (typeof parsed === 'object' && parsed !== null) {
                return localizeData(parsed, lang);
            }
        } catch (e) {
            // Not a valid JSON string, leave it
        }
    }

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => localizeData(item, lang));
    }

    // Handle Objects
    if (typeof data === 'object') {
        // Is it a localized string shape?
        if (typeof data.en === 'string') {
            if (!lang) {
                return data; // Return full translations if no language specified
            }
            const val = data[lang];
            if (val === undefined || val === null || val === '' || val === '-') {
                return data['en'];
            }
            return val;
        }

        // Otherwise recurse through the object
        const localizedObject: any = {};
        for (const [key, value] of Object.entries(data)) {
            // Keep Dates as Dates
            if (value instanceof Date) {
                localizedObject[key] = value;
            } else {
                localizedObject[key] = localizeData(value, lang);
            }
        }
        return localizedObject;
    }

    // Return primitives
    return data;
}
