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

export async function generateProjectStory(params: {
    title: string;
    description?: string;
    type?: string;
    tags?: string[];
    skills?: string[];
    prompt?: string;
}): Promise<string> {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not configured in the backend environment.');
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.5-flash',
            systemInstruction: `You are a professional software engineer, technical writer, and personal blogger. Generate a compelling, high-quality project story in Markdown format for a developer portfolio page.

The entire text MUST be written in a literal, conversational storytelling format:
- Write in natural, flowing paragraphs.
- Avoid using dry bulleted lists, technical tables, tree structure diagrams, or formal feature checklists.
- Maintain an authentic, personal first-person voice (using "I" for individual projects or "we" for group projects).
- Use conversational headers rather than rigid system headings (e.g., use '## How did I come up with the idea?' or '## The Search for a Solution' instead of '## Why it exists' or '## Features list').
- Keep a human, developer-blog tone, incorporating real thoughts, engineering decisions, and personal takeaways (e.g. explaining why standard options didn't fit, what trade-offs were made, what is still in progress, and the expected outcomes).

If a Product Requirement Document (PRD), specification, or notes outline is provided:
- Analyze it thoroughly to understand the technical context, but synthesize the details into organic prose.
- Translate the requirements, features, and tech stack into the story's narrative flow rather than listing them out.
- Highlight the motivation (Why), the core features (What), the engineering implementation (How), and personal lessons/challenges (Learnings) entirely as cohesive narrative paragraphs.

Guidelines:
- Do NOT output extra text or markdown wrappers like \`\`\`markdown ... \`\`\`, return ONLY the raw markdown text itself.
- Do NOT invent fake company names or client details unless provided. Keep it focused on the technical and product journey.
- Keep the length comprehensive but engaging (about 400 to 600 words).`
        });

        const projectTypeStr = params.type === 'group' ? 'group project' : 'individual personal project';
        const tagsStr = params.tags && params.tags.length > 0 ? params.tags.join(', ') : 'None';
        const skillsStr = params.skills && params.skills.length > 0 ? params.skills.join(', ') : 'None';

        let promptContent = `Generate a storytelling project description for:
Project Title: ${params.title}
Project Type: ${projectTypeStr}
Short Overview: ${params.description || 'None'}
Tags: ${tagsStr}
Technologies/Skills Used: ${skillsStr}
`;

        if (params.prompt && params.prompt.trim() !== '') {
            promptContent += `\nAdditional User Notes/Outline to incorporate:\n${params.prompt}`;
        }

        const result = await model.generateContent(promptContent);
        const responseText = result.response.text();
        return responseText.trim();
    } catch (error: any) {
        console.error('Gemini content generation service error:', error);
        throw new Error(`Content generation failed: ${error.message || error}`);
    }
}
