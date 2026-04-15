// services/contestService.js
// Fetches upcoming contests from Codeforces API + caches them

const https = require('https');

const CODEFORCES_API = 'https://codeforces.com/api';

const cache = {
  contests:    null,
  lastFetched: null,
  TTL:         1000 * 60 * 15,  // 15 minutes — contests change more frequently
};

// ─── Get upcoming contests ────────────────────────────────────────────────────

async function getUpcomingContests() {
  if (cache.contests && Date.now() - cache.lastFetched < cache.TTL) {
    return cache.contests;
  }

  const data = await cfGet('/contest.list?gym=false');

  if (data.status !== 'OK') {
    throw new Error('Codeforces API error: ' + data.comment);
  }

  // Filter only upcoming/running contests (phase: BEFORE or CODING)
  const now = Date.now();

  cache.contests = data.result
    .filter(c => c.phase === 'BEFORE' || c.phase === 'CODING')
    .map(c => ({
      id:               c.id,
      name:             c.name,
      type:             c.type,             // CF, ICPC, IOI
      phase:            c.phase,            // BEFORE | CODING
      durationSeconds:  c.durationSeconds,
      startTimeSeconds: c.startTimeSeconds,
      startTime:        c.startTimeSeconds
                          ? new Date(c.startTimeSeconds * 1000).toISOString()
                          : null,
      registerUrl:      `https://codeforces.com/contestRegistration/${c.id}`,
      contestUrl:       `https://codeforces.com/contest/${c.id}`,
      relativeTime:     getRelativeTime(c.startTimeSeconds * 1000),
      duration:         formatDuration(c.durationSeconds),
      isLive:           c.phase === 'CODING',
    }))
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
    .slice(0, 20);  // max 20 upcoming contests

  cache.lastFetched = Date.now();
  return cache.contests;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRelativeTime(startMs) {
  const diff = startMs - Date.now();

  if (diff < 0) return 'Live now';

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0)    return `in ${days}d ${hours}h`;
  if (hours > 0)   return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function cfGet(endpoint) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req   = https.get(`${CODEFORCES_API}${endpoint}`, { agent, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse Codeforces response')); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Codeforces API timed out')); });
    req.on('error', reject);
  });
}

module.exports = { getUpcomingContests };