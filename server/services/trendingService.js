const fetch = require('node-fetch') || global.fetch;

async function getTrendingDevNews() {
    try {
        const response = await fetch('https://dev.to/api/articles?top=1&per_page=4');
        if (!response.ok) return [];
        const data = await response.json();
        return data.map(item => ({
            title: item.title,
            url: item.url,
            tags: item.tag_list,
            author: item.user.name,
            readingTime: item.reading_time_minutes
        }));
    } catch (err) {
        console.error('Error fetching Dev.to news:', err.message);
        return [];
    }
}

async function getTrendingGitHub() {
    try {
        // Calculate date 7 days ago in YYYY-MM-DD format
        const date = new Date();
        date.setDate(date.getDate() - 7);
        const dateString = date.toISOString().split('T')[0];

        const response = await fetch(
            `https://api.github.com/search/repositories?q=created:>${dateString}&sort=stars&order=desc&per_page=4`,
            { headers: { 'User-Agent': 'NodeApp/1.0' } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.items) return [];
        return data.items.map(repo => ({
            name: repo.name,
            fullName: repo.full_name,
            url: repo.html_url,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count
        }));
    } catch (err) {
        console.error('Error fetching GitHub trending:', err.message);
        return [];
    }
}

module.exports = {
    getTrendingDevNews,
    getTrendingGitHub
};
