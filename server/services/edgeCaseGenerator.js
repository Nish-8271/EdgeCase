const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateEdgeCases(problemStatement) {
    // Check if the API key is present
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing from the environment variables. Please add it to your .env file.");
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using gemini-2.5-flash which is widely available and fast
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//         const prompt = `You are an expert QA engineer and software tester. 
        
// Given the following algorithmic or software problem statement, generate a comprehensive list of critical edge cases, special constraints, and potential pitfalls that a developer should test against. 
// Format the output nicely in Markdown with clear headings and bullet points.

// Problem Statement:
// "${problemStatement}"

// Please include:
// 1. Standard test cases
// 2. Boundary / Edge cases (e.g., empty inputs, extremely large inputs, negative values, null/undefined if applicable)
// 3. Specialized cases based on the specific logic of the problem.
// `;
const prompt = `
You are a competitive programming expert.

Given the following problem, generate test cases.

Rules:
- Generate exactly 5 test cases
- Include:
  • 2 normal cases
  • 2 edge cases (boundary values, min/max, empty, etc.)
  • 1 tricky case that can break incorrect solutions
- Do explain why each test case is important and what it tests for.
- Do NOT use markdown
- Output only plain text

Format strictly like this:

Input:
...
Reasoning:
Input:
...
Reasoning:
Problem:
${problemStatement}
`;

        const result = await model.generateContent(prompt,retries=3);
        return result.response.text();
    } catch (error) {
        if(error.status===503 && retries >0){
            // Retry generating edgecase
            await new Promise(resolve => setTimeout(resolve, 2000)); // wait for 1 second before retrying
            return await generateEdgeCases(problemStatement,retries-1);
        };
        
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate edge cases using AI.");
    }
}

module.exports = {
    generateEdgeCases
};
