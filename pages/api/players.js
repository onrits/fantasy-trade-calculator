// pages/api/players.js
export default async function handler(req, res) {
    try {
        const response = await fetch('https://api.sleeper.app/v1/players/nfl');
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch players' });
        }
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
