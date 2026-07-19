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
    files?: Array<{
        buffer: Buffer;
        originalname: string;
        mimetype: string;
    }>;
}): Promise<string> {
    if (!genAI) {
        throw new Error('GEMINI_API_KEY is not configured in the backend environment.');
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.5-flash',
            systemInstruction: `You are a professional project manager and senior product owner with deep technical expertise about the your products, you are also a professional content writer that knows how to attract people to read your writings. Your task is to generate a comprehensive, premium portfolio project case study in Markdown format.

The entire text MUST be written in a literal, engaging, first-person storytelling case study format:
- Structure the text around standard research and product design case study phases (e.g., Context & Origin, The Core Problem, The Technical Strategy, Outcomes & Deliverables, and Takeaways).
- Use natural, flowing paragraphs. Write in an authentic, personal first-person voice (using "I" for individual projects or "we" for group projects).
- Use engaging, conversational headers that frame a story (e.g., '## Setting the Scene: The Project Origin', '## The Challenge: Privacy vs. Convenience', '## The Technical Strategy: Offline-First Security', '## Outcomes & Current State', '## Key Takeaways & Lessons').
- Do NOT use dry bulleted lists, technical tables, tree structure diagrams, or formal checklists. Turn all technical descriptions and features into narrative prose.

Image Placement Suggestions:
- You must suggest to the user where to put images/illustrations to make the case study visually engaging.
- Place a clear, descriptive placeholder where it would be beneficial to add an image.
- Format the image suggestion exactly like this:
  ![[SUGGESTION: Describe what type of screenshot, diagram, or mock-up should go here to illustrate this section of the case study]]

If a Product Requirement Document (PRD), specification, or notes outline (including uploaded PDFs or text files) is provided:
- Analyze it thoroughly as a project manager to extract the technical context, goals, features, and constraints.
- Synthesize all raw specifications and design parameters into cohesive narrative paragraphs without list structures.
- Detail the exact technologies and libraries used (e.g., SQLCipher, Room, Jetpack Compose) and describe their strategic choices.

Keep the length comprehensive and professional (about 700 to 1500 words).`
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
