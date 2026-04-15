const { GoogleGenerativeAI } = require('@google/generative-ai');

async function analyzeCode(code, language) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a senior software engineer.

Analyze the given code and return:

Time Complexity:
<big-O>

Space Complexity:
<big-O>

Approach:
<2-3 lines explaining logic>

Observations:
<short bullet-like insights>

Optimizations:
<possible improvements>

Rules:
- Keep output very short and crisp
- No markdown
- No extra explanations
- Plain text only

Language: ${language}

Code:
${code}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = {
    analyzeCode
};
