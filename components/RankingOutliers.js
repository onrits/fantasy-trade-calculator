import React, { useMemo } from 'react';
import marketRanks from '../data/playerValues.json';

function getOutliers(userRankings, marketMap, limit = 5) {
    const deltas = userRankings.map(player => {
        const market = marketMap[player.name];
        if (!market || player.value == null || market.value == null) return null;

        const delta = player.value - market.value;
        return {
            name: player.name,
            yourValue: player.value,
            marketValue: market.value,
            delta,
        };
    }).filter(Boolean);

    const higher = deltas
        .filter(p => p.delta > 0)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, limit);

    const lower = deltas
        .filter(p => p.delta < 0)
        .sort((a, b) => a.delta - b.delta)
        .slice(0, limit);

    return { higher, lower };
}

const RankingOutliers = ({ userRankings }) => {
    const marketMap = useMemo(() => {
        const map = {};
        marketRanks.forEach(p => {
            map[p.Player] = p;
        });
        return map;
    }, []);

    const { higher, lower } = useMemo(
        () => getOutliers(userRankings, marketMap),
        [userRankings, marketMap]
    );

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        }}>
            <h3 style={{ marginTop: 0 }}>📈 Higher Than Consensus</h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: '1.5rem' }}>
                {higher.map(p => (
                    <li key={p.name} style={{ color: 'green', marginBottom: '6px' }}>
                        <strong>{p.name}</strong>: You {p.yourValue.toFixed(2)} vs Market {p.marketValue.toFixed(2)} (+{p.delta.toFixed(2)})
                    </li>
                ))}
            </ul>

            <h3>📉 Lower Than Consensus</h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                {lower.map(p => (
                    <li key={p.name} style={{ color: 'red', marginBottom: '6px' }}>
                        <strong>{p.name}</strong>: You {p.yourValue.toFixed(2)} vs Market {p.marketValue.toFixed(2)} ({p.delta.toFixed(2)})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RankingOutliers;
