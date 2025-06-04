import { useState, useEffect, useMemo } from 'react';
import TradeInput from '../components/TradeInput';
import Legend from '../components/Legend';
import EditableRankings from '../components/EditableRankings';
import playerValues from '../data/playerValues.json';
import draftPickValues from '../data/draftPickValues.json';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [team1Assets, setTeam1Assets] = useState([]);
  const [team2Assets, setTeam2Assets] = useState([]);

  useEffect(() => {
    const normalizedPlayers = playerValues.map(p => ({
      ...p,
      id: `player-${p.Player}`,
      name: p.Player,
      value: p.VALUE || 0,
      type: 'Player',
      position: p.Position || '',
    }));
    setPlayers(normalizedPlayers);
  }, []);

  const draftPickValueMap = useMemo(() => {
    return draftPickValues.reduce((acc, pick) => {
      if (pick['Draft Pick']) acc[pick['Draft Pick']] = pick.Value || 0;
      return acc;
    }, {});
  }, []);

  const allItems = useMemo(() => {
    const normalizedPicks = draftPickValues
      .filter(p => p["Draft Pick"])
      .map(p => ({
        id: `pick-${p["Draft Pick"]}`,
        label: p["Draft Pick"],
        value: draftPickValueMap[p["Draft Pick"]] || 0,
        type: 'Pick',
      }));

    const normalizedPlayers = players.map(p => ({
      ...p,
      id: `player-${p.Player}`,
      name: p.Player,
      value: p.VALUE || 0,
      type: 'Player',
      position: p.Position || '',
    }));

    return [...normalizedPlayers, ...normalizedPicks];
  }, [players, draftPickValueMap]);

  function addToTeam1(item) {
    setTeam1Assets(prev => (prev.find(i => i.id === item.id) ? prev : [...prev, item]));
  }

  function addToTeam2(item) {
    setTeam2Assets(prev => (prev.find(i => i.id === item.id) ? prev : [...prev, item]));
  }

  function removeFromTeam1(id) {
    setTeam1Assets(prev => prev.filter(i => i.id !== id));
  }

  function removeFromTeam2(id) {
    setTeam2Assets(prev => prev.filter(i => i.id !== id));
  }

  const totalValue = assets => assets.reduce((sum, a) => sum + (a.value || 0), 0);

  // Calculate values for both teams
  const team1Value = totalValue(team1Assets);
  const team2Value = totalValue(team2Assets);
  const totalCombined = team1Value + team2Value;

  // Avoid division by zero, default to equal split if no assets
  const team1Percent = totalCombined > 0 ? (team1Value / totalCombined) * 100 : 50;
  const team2Percent = totalCombined > 0 ? (team2Value / totalCombined) * 100 : 50;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Fantasy Trade Calculator</h1>

      <div className={styles.mainLayout}>
        {/* LEFT COLUMN: Calculator + Legend */}
        <div className={styles.leftColumn}>
          <section className={styles.calculator}>
            <h2 className={`${styles.sectionTitle} ${styles.team1Title}`}>
              Team 1 (Total Value: {team1Value.toFixed(3)})
            </h2>
            <TradeInput allItems={allItems} selectedAssets={team1Assets} onSelect={addToTeam1} />
            <ul className={styles.assetList}>
              {team1Assets.map(asset => (
                <li key={asset.id} className={`${styles.assetItem} ${styles.team1}`}>
                  <span>
                    {(asset.name || asset.label)} ({asset.position || asset.type || 'Pick'}) - Value:{' '}
                    {asset.value?.toFixed(2) || '0.00'}
                  </span>
                  <button
                    onClick={() => removeFromTeam1(asset.id)}
                    className={`${styles.removeButton} ${styles.team1}`}
                    aria-label={`Remove ${asset.name || asset.label} from Team 1`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <h2 className={`${styles.sectionTitle} ${styles.marginTop} ${styles.team2Title}`}>
              Team 2 (Total Value: {team2Value.toFixed(3)})
            </h2>
            <TradeInput allItems={allItems} selectedAssets={team2Assets} onSelect={addToTeam2} />
            <ul className={styles.assetList}>
              {team2Assets.map(asset => (
                <li key={asset.id} className={`${styles.assetItem} ${styles.team2}`}>
                  <span>
                    {(asset.name || asset.label)} ({asset.position || asset.type || 'Pick'}) - Value:{' '}
                    {asset.value?.toFixed(2) || '0.00'}
                  </span>
                  <button
                    onClick={() => removeFromTeam2(asset.id)}
                    className={`${styles.removeButton} ${styles.team2}`}
                    aria-label={`Remove ${asset.name || asset.label} from Team 2`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            {/* --- TRADE COMPARISON BAR --- */}
            <div className={styles.tradeComparisonContainer}>
              <div className={styles.tradeComparisonBar}>
                <div
                  className={styles.team1Bar}
                  style={{ width: `${team1Percent}%` }}
                  title={`Team 1: ${team1Value.toFixed(2)}`}
                />
                <div
                  className={styles.team2Bar}
                  style={{ width: `${team2Percent}%` }}
                  title={`Team 2: ${team2Value.toFixed(2)}`}
                />
              </div>
              <div className={styles.tradeComparisonLabel}>
                {team1Value > team2Value
                  ? 'Team 1 is winning this trade'
                  : team2Value > team1Value
                    ? 'Team 2 is winning this trade'
                    : 'Trade is even'}
              </div>
            </div>
          </section>

          <section className={styles.legend}>
            <Legend />
          </section>
        </div>

        {/* RIGHT COLUMN: Rankings */}
        <aside className={styles.rankings}>
          <h2 className={styles.sectionTitle}>Edit Rankings</h2>
          <EditableRankings players={players} onChange={setPlayers} />
        </aside>
      </div>
    </div>
  );
}
