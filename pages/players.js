// pages/players.js
import { useEffect, useState } from 'react';

export default function Players() {
    const [players, setPlayers] = useState(null);

    useEffect(() => {
        fetch('/api/players')
            .then(res => res.json())
            .then(data => {
                // Filter players by position
                const filtered = Object.values(data).filter(player =>
                    ['QB', 'RB', 'WR', 'TE'].includes(player.position)
                );
                setPlayers(filtered);
            })
            .catch(console.error);
    }, []);

    if (!players) return <div>Loading players...</div>;

    return (
        <div>
            <h1>Player List (QB, RB, WR, TE only)</h1>
            <ul>
                {players.slice(0, 50).map(player => (
                    <li key={player.player_id}>
                        {player.full_name} — {player.position} — {player.team}
                    </li>
                ))}
            </ul>
            <p>Showing first 50 players</p>
        </div>
    );
}
