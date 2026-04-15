require('dotenv').config({ path: '.env' });
const { analyzeCode } = require('./server/services/analyzeService');

async function testAnalyze() {
    console.log("Checking API Key: ", process.env.OPENAI_API_KEY ? "Found" : "Missing");
    
    const code = `
function binarySearch(arr, x) {
    let l = 0, r = arr.length - 1;
    while (l <= r) {
        let m = l + Math.floor((r - l) / 2);
        if (arr[m] == x) return m;
        if (arr[m] < x) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`;

    try {
        console.log("Calling OpenAI API...");
        const result = await analyzeCode(code, "javascript");
        console.log("--- RESULT START ---");
        console.log(result);
        console.log("--- RESULT END ---");
    } catch (err) {
        console.error("Test Failed:\n", err);
    }
}

testAnalyze();
