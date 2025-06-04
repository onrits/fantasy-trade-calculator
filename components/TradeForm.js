import { useState } from 'react';
import TradeInput from './TradeInput';
import styles from '../styles/Home.module.css';

export default function TradeForm({ allItems }) {
    const [team1Assets, setTeam1Assets] = useState([]);
    const [team2Assets, setTeam2Assets] = useState([]);

    const totalValue = assets =>
        assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

    const team1Total = totalValue(team1Assets);
    const team2Total = totalValue(team2Assets);

    const addToTeam = (teamSetter, assets) => item => {
        teamSetter(prev =>
            prev.find(i => i.id === item.id) ? prev : [...prev, item]
        );
    };

    const removeFromTeam = (teamSetter, assets) => id => {
        teamSetter(prev => prev.filter(i => i.id !== id));
    };

    const totalCombined = team1Total + team2Total;
    const percent1 = totalCombined === 0 ? 50 : (team1Total / totalCombined) * 100;
    const percent2 = 100 - percent1;

    let winner = '';
    if (team1Total > team2Total) winner = 'Team 1 Wins';
    else if (team2Total > team1Total) winner = 'Team 2 Wins';
    else if (team1Total === 0 && team2Total === 0) winner = '';
    else winner = 'Even Trade';

    return (
        <div className={styles.tradeForm}>
            <h2 className={`${styles.sectionTitle} ${styles.team1Title}`}>
                Team 1 (Total Value: {team1Total.toFixed(3)})
            </h2>
            <TradeInput
                allItems={allItems}
                selectedAssets={team1Assets}
                onSelect={addToTeam(setTeam1Assets, team1Assets)}
            />
            <ul className={styles.assetList}>
                {team1Assets.map(asset => (
                    <li key={asset.id} className={`${styles.assetItem} ${styles.team1}`}>
                        <span>
                            {(asset.name || asset.label)} ({asset.position || asset.type || 'Pick'}) - Value:{' '}
                            {asset.value?.toFixed(2) || '0.00'}
                        </span>
                        <button
                            onClick={removeFromTeam(setTeam1Assets, team1Assets)(asset.id)}
                            className={`${styles.removeButton} ${styles.team1}`}
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>

            <h2 className={`${styles.sectionTitle} ${styles.marginTop} ${styles.team2Title}`}>
                Team 2 (Total Value: {team2Total.toFixed(3)})
            </h2>
            <TradeInput
                allItems={allItems}
                selectedAssets={team2Assets}
                onSelect={addToTeam(setTeam2Assets, team2Assets)}
            />
            <ul className={styles.assetList}>
                {team2Assets.map(asset => (
                    <li key={asset.id} className={`${styles.assetItem} ${styles.team2}`}>
                        <span>
                            {(asset.name || asset.label)} ({asset.position || asset.type || 'Pick'}) - Value:{' '}
                            {asset.value?.toFixed(2) || '0.00'}
                        </span>
                        <button
                            onClick={removeFromTeam(setTeam2Assets, team2Assets)(asset.id)}
                            className={`${styles.removeButton} ${styles.team2}`}
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>

            {/* Trade Comparison Bar */}
            {(team1Total > 0 || team2Total > 0) && (
                <div className={styles.tradeComparisonContainer}>
                    <div className={styles.tradeComparisonBar}>
                        <div
                            className={styles.team1Bar}
                            style={{ width: `${percent1}%` }}
                        />
                        <div
                            className={styles.team2Bar}
                            style={{ width: `${percent2}%` }}
                        />
                    </div>
                    <div className={styles.tradeComparisonLabel}>
                        {winner}
                    </div>
                </div>
            )}
        </div>
    );
}
