import { useState, useEffect, useMemo } from 'react';
import TradeInput from '../components/TradeInput';
import Legend from '../components/Legend';
import EditableRankings from '../components/EditableRankings';
import playerValues from '../data/playerValues.json';
import draftPickValues from '../data/draftPickValues.json';
import { evaluateTrade } from '../utils/tradeLogic';

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
      tier: p.TIER || p.tier || null,
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

  const {
    rawTeam1Total,
    rawTeam2Total,
    adjustedTeam1Total,
    adjustedTeam2Total,
    percent1: team1Percent,
    percent2: team2Percent,
    winner,
    isEvenTrade,
    reason,
  } = evaluateTrade(team1Assets, team2Assets, {
    margin: 0.075,
    allItems,
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Fantasy Trade Calculator</h1>

      <div className={styles.mainLayout}>
        {/* LEFT COLUMN: Calculator + Legend */}
        <div className={styles.leftColumn}>
          <section className={styles.calculator}>
            <h2 className={`${styles.sectionTitle} ${styles.team1Title}`}>
              Team 1 (Total: {rawTeam1Total.toFixed(3)} | Adjusted: {adjustedTeam1Total.toFixed(3)})
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
              Team 2 (Total: {rawTeam2Total.toFixed(3)} | Adjusted: {adjustedTeam2Total.toFixed(3)})
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
              <div className={styles.tradeComparisonBarWrapper}>
                {/* Background buffer bar */}
                <div className={styles.bufferBar} />

                {/* Even zone overlay — sibling to bufferBar and foregroundBar */}
                <div
                  className={styles.evenZone}
                  style={{
                    left: `${50 - 7.5}%`,
                    width: `15%`,
                  }}
                />

                {/* Foreground bars */}
                <div className={styles.foregroundBar}>
                  {isEvenTrade ? (
                    // Center a single bar in the even zone when trade is even
                    <div
                      className={styles.teamEvenBar}
                      style={{
                        width: '15%',
                        left: '42.5%', // 50% - half of 15% = 42.5%
                        position: 'absolute',
                      }}
                      title={`Even Trade: ${adjustedTeam1Total.toFixed(2)} / ${adjustedTeam2Total.toFixed(2)}`}
                    />
                  ) : (
                    <>
                      <div
                        className={styles.team1Bar}
                        style={{ width: `${team1Percent}%` }}
                        title={`Team 1: ${adjustedTeam1Total.toFixed(2)}`}
                      />
                      <div
                        className={styles.team2Bar}
                        style={{ width: `${team2Percent}%` }}
                        title={`Team 2: ${adjustedTeam2Total.toFixed(2)}`}
                      />
                    </>
                  )}
                </div>

                {/* Midline at 50% */}
                <div className={styles.midLine} />
              </div>

              <div className={styles.tradeComparisonLabel}>{winner}</div>
              {reason && <div className={styles.tradeComparisonReason}>{reason}</div>}
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
