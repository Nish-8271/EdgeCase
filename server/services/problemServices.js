const https=require('https');
const dotenv = require('dotenv');
const path   = require('path');
const { name } = require('ejs');
const api_Key=process.env.CODEFORCE_API_KEY;
const apiSecret=process.env.CODEFORCE_API_SECRET;
const CODEFORCES_API=`https://codeforces.com/api`;

const cache = {
  problems:   null,
  lastFetched: null,
  TTL:        1000 * 60 * 30,  // 30 minutes
};
// Cache2 for allcontests
const contestCache={
    contests:null,
    lastFetched:null,
    TTL:1000*60*60, // 60 minutes
};

// get All Problems
async function getAllProblems({ tags = [], minRating, maxRating, page = 1, limit = 50 } = {}){

    if(cache.problems && (Date.now() - cache.lastFetched < cache.TTL)){
        return filterAndPaginate(cache.problems,{tags,minRating,maxRating,page,limit});
    }
    //fetch from codeforces
    const data=await cfGet('problemset.problems');
    
    if(data.status!=='OK') throw new Error('Failed to fetch problems from Codeforces');

    cache.problems=data.result.problems.map(p=>({
        id: `${p.contestId}-${p.index}`,
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        tags: p.tags||[],
        rating: p.rating || null,
        url:`https://codeforces.com/contest/${p.contestId}/problem/${p.index}`
    }));

    cache.lastFetched = Date.now();
    // console.log('hello');
    return filterAndPaginate(cache.problems,{tags,minRating,maxRating,page,limit});
}
// Get Single problem by id 

async function getProblemById(problemId) {
  // problemId format: "1234A" → contestId=1234, index="A"
  
  const match = problemId.match(/^(\d+)([A-Z]\d*)$/i);
  if (!match) throw new Error('Invalid problem ID format. Expected e.g. "1234A"');
 
  const contestId = parseInt(match[1]);
  const index     = match[2].toUpperCase();
 
  // Make sure cache is populated
  if (!cache.problems || Date.now() - cache.lastFetched >= cache.TTL) {
    await getAllProblems();
  }
 
  const problem = cache.problems.find(
    p => p.contestId === contestId && p.index === index
  );
 
  if (!problem) throw new Error(`Problem ${problemId} not found.`);
 
  return problem;
}
 
// ─── Get all available tags ───────────────────────────────────────────────────
 
async function getAllTags() {
  if (!cache.problems) await getAllProblems();
 
  const tagSet = new Set();
  for (const p of cache.problems) {
    for (const tag of p.tags) tagSet.add(tag);
  }
 
  return [...tagSet].sort();
}
 


// Helper 
function filterAndPaginate(problems,{tags,minRating,maxRating,page,limit}){
    let filtered=problems;

    if(tags && tags.length>0){
        console.log('Filtering by tags:', tags);
        filtered=filtered.filter(p=>tags.every(tag=>p.tags.includes(tag)));
    }
    // Filter by minRating
    if(minRating){
        filtered=filtered.filter(p=>p.rating && p.rating>=minRating);
    }
    // Filter by maxRating
    if(maxRating){
        filtered=filtered.filter(p=>p.rating && p.rating<=maxRating);
    }
    const total=filtered.length;
    const totalPages=Math.ceil(total/limit);
    const start=(page-1)*limit;
    const end=start+limit;
    const items=filtered.slice(start,end);
    return {problems:items,total,totalPages,page,limit};
}
// Filtering contests on the basis of timeline and divisions


// Simple https GET request wrapper for Codeforces API->return parsed JSON
function cfGet(endpoint) {
    return new Promise((resolve, reject) => {
        const url= `${CODEFORCES_API}/${endpoint}`;
        https.get(url,(res)=>{
            let data='';
            res.on('data',chunk=>data+=chunk);
            res.on('end',()=>{
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(new Error(`Failed to parse Codeforces API response: ${err.message}`));
                }
        });
    }).on('error',reject);
    });
}

module.exports={
    getAllProblems,
    getProblemById,
    getAllTags
};
