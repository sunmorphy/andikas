import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

export async function translateText(text: string, targetLangs: string[] = ['id', 'de', 'ja', 'nl']): Promise<Record<string, string>> {
    if (!text || text.trim() === '') {
        return targetLangs.reduce((acc, lang) => {
            acc[lang] = '';
            return acc;
        }, {} as Record<string, string>);
    }

    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not configured in the backend environment.');
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
            },
            systemInstruction: 'You are a professional translator and localization assistant. Translate the user provided English text into the specified languages. Return exactly a JSON object mapping the language codes to the translated text. Preserve all markdown formatting, line breaks, HTML markup, and placeholders exactly.'
        });

        const prompt = `Translate the following English text into these target languages: ${targetLangs.join(', ')}.
Output a JSON object with keys: ${targetLangs.map(lang => `"${lang}"`).join(', ')}.

English content to translate:
${text}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const parsed = JSON.parse(responseText);
        
        // Ensure all target languages are present in the response
        const translations: Record<string, string> = {};
        for (const lang of targetLangs) {
            translations[lang] = parsed[lang] || '';
        }
        
        return translations;
    } catch (error: any) {
        console.error('Gemini translation service error:', error);
        throw new Error(`Translation failed: ${error.message || error}`);
    }
}
