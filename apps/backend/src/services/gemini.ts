import { GoogleGenerativeAI } from '@google/generative-ai';

function getGenAI(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('GEMINI_API_KEY is not configured in the backend environment.');
    }
    return new GoogleGenerativeAI(apiKey);
}

export async function translateText(text: string, targetLangs: string[] = ['id', 'de', 'ja', 'nl']): Promise<Record<string, string>> {
    if (!text || text.trim() === '') {
        return targetLangs.reduce((acc, lang) => {
            acc[lang] = '';
            return acc;
        }, {} as Record<string, string>);
    }

    const genAI = getGenAI();

    const modelName = process.env.GEMINI_TRANSLATE_MODEL || process.env.GEMINI_MODEL;
    if (!modelName || modelName.trim() === '') {
        throw new Error('Gemini translation model is not configured. Please set GEMINI_TRANSLATE_MODEL or GEMINI_MODEL in the backend environment.');
    }

    const systemInstruction = process.env.GEMINI_TRANSLATE_SYSTEM_INSTRUCTION || process.env.GEMINI_TRANSLATE_PROMPT;
    if (!systemInstruction || systemInstruction.trim() === '') {
        throw new Error('Gemini translation prompt is not configured. Please set GEMINI_TRANSLATE_SYSTEM_INSTRUCTION in the backend environment.');
    }

    try {
        const model = genAI.getGenerativeModel({
            model: modelName.trim(),
            generationConfig: {
                responseMimeType: 'application/json',
            },
            systemInstruction: systemInstruction.trim(),
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

export async function generateProjectStory(params: {
    title: string;
    description?: string;
    type?: string;
    tags?: string[];
    skills?: string[];
    prompt?: string;
    files?: Array<{
        buffer: Buffer;
        originalname: string;
        mimetype: string;
    }>;
}): Promise<string> {
    const genAI = getGenAI();

    const modelName = process.env.GEMINI_STORY_MODEL || process.env.GEMINI_MODEL;
    if (!modelName || modelName.trim() === '') {
        throw new Error('Gemini story generation model is not configured. Please set GEMINI_STORY_MODEL or GEMINI_MODEL in the backend environment.');
    }

    const systemInstruction = process.env.GEMINI_STORY_SYSTEM_INSTRUCTION || process.env.GEMINI_STORY_PROMPT;
    if (!systemInstruction || systemInstruction.trim() === '') {
        throw new Error('Gemini story generation prompt is not configured. Please set GEMINI_STORY_SYSTEM_INSTRUCTION in the backend environment.');
    }

    try {
        const model = genAI.getGenerativeModel({
            model: modelName.trim(),
            systemInstruction: systemInstruction.trim(),
        });

        const projectTypeStr = params.type === 'group' ? 'group project' : 'individual personal project';
        const tagsStr = params.tags && params.tags.length > 0 ? params.tags.join(', ') : 'None';
        const skillsStr = params.skills && params.skills.length > 0 ? params.skills.join(', ') : 'None';

        let promptContent = `Generate a storytelling case study project content body for:
Project Title: ${params.title}
Project Type: ${projectTypeStr}
Short Overview: ${params.description || 'None'}
Tags: ${tagsStr}
Technologies/Skills Used: ${skillsStr}
`;

        if (params.prompt && params.prompt.trim() !== '') {
            promptContent += `\nAdditional User Notes/Outline/PRD:\n${params.prompt}`;
        }

        const promptParts: any[] = [promptContent];

        if (params.files && params.files.length > 0) {
            for (const file of params.files) {
                if (file.mimetype === 'application/pdf') {
                    promptParts.push({
                        inlineData: {
                            data: file.buffer.toString('base64'),
                            mimeType: 'application/pdf'
                        }
                    });
                } else if (file.mimetype.startsWith('text/') || file.originalname.endsWith('.txt') || file.originalname.endsWith('.md')) {
                    const textContent = file.buffer.toString('utf-8');
                    promptParts.push(`\nUploaded Document [${file.originalname}]:\n${textContent}\n`);
                }
            }
        }

        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();
        return responseText.trim();
    } catch (error: any) {
        console.error('Gemini content generation service error:', error);
        throw new Error(`Content generation failed: ${error.message || error}`);
    }
}
