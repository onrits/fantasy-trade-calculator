import { useState, useEffect, useMemo } from 'react';
import TradeInput from '../components/TradeInput';
import Legend from '../components/Legend';
import EditableRankings from '../components/EditableRankings';
import playerValues from '../data/playerValues.json';
import draftPickValues from '../data/draftPickValues.json';
import { evaluateTrade } from '../utils/tradeLogic';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import styles from '../styles/Home.module.css';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [team1Assets, setTeam1Assets] = useState([]);
  const [team2Assets, setTeam2Assets] = useState([]);
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load user rankings or default players on mount or user change
  useEffect(() => {
    const loadUserRankings = async () => {
      if (user) {
        const docRef = doc(db, 'userRankings', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setPlayers(docSnap.data().players);
          return;
        }
      }

      // Fallback: use default player values for guests or first-time users
      const normalizedPlayers = playerValues.map(p => ({
        ...p,
        id: `player-${p.Player}`,
        name: p.Player,
        value: p.VALUE || 0,
        type: 'Player',
        position: p.Position || '',
      }));
      setPlayers(normalizedPlayers);
    };

    loadUserRankings();
  }, [user]);

  // === Remove auto-save effect ===
  // useEffect(() => {
  //   if (!user || players.length === 0) return;
  //
  //   const saveRankings = async () => {
  //     const docRef = doc(db, 'userRankings', user.uid);
  //     await setDoc(docRef, { players });
  //   };
  //
  //   saveRankings();
  // }, [players, user]);

  // Manual save handler
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, 'userRankings', user.uid);
      await setDoc(docRef, { players });
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving rankings:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 2000); // hide success message after 2 seconds
    }
  };

  const handleResetRankings = async () => {
    if (user) {
      try {
        const docRef = doc(db, 'userRankings', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPlayers(docSnap.data().players);
        } else {
          // No saved data, fallback to default
          setPlayers(playerValues.map(p => ({
            ...p,
            id: `player-${p.Player}`,
            name: p.Player,
            value: p.VALUE || 0,
            type: 'Player',
            position: p.Position || '',
          })));
        }
      } catch (error) {
        console.error('Error resetting rankings:', error);
      }
    } else {
      // Guest fallback: reset to default rankings
      setPlayers(playerValues.map(p => ({
        ...p,
        id: `player-${p.Player}`,
        name: p.Player,
        value: p.VALUE || 0,
        type: 'Player',
        position: p.Position || '',
      })));
    }
  };

  const handleResetToDefault = () => {
    const defaultPlayers = playerValues.map(p => ({
      ...p,
      id: `player-${p.Player}`,
      name: p.Player,
      value: p.VALUE || 0,
      type: 'Player',
      position: p.Position || '',
      tier: p.TIER || p.tier || null,
    }));
    setPlayers(defaultPlayers);
  };


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
        tier: p.TIER ?? p.tier ?? null,
        season: parseInt(p["Draft Pick"]?.split(' ')[0]) || null,
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

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Loading...</h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dynasty Trade Calculator</h1>
      <p className={styles.tagline}>
        Edit the rankings to create your own personal calculator.
      </p>

      <div className={styles.authControls} style={{ marginBottom: '1rem' }}>
        {user ? (
          <>
            <span>Signed in as <strong>{user.displayName || user.email}</strong></span>
            <button
              onClick={logout}
              className={styles.buttonSecondary}
              style={{ marginLeft: '1rem' }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={signInWithGoogle} className={styles.buttonPrimary}>
            Sign In with Google
          </button>
        )}

      </div>

      <div className={styles.mainLayout}>
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
                    {(asset.name || asset.label)}{' '}
                    ({asset.position || asset.Pos || asset.Position || asset.type || 'Pick'}, Tier {parseInt(asset.tier || asset.TIER || '?')})
                    {' '} - Value: {asset.value?.toFixed(2) || '0.00'}
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
                    {(asset.name || asset.label)}{' '}
                    ({asset.position || asset.Pos || asset.Position || asset.type || 'Pick'}, Tier {asset.tier ?? '?'})
                    {' '} - Value: {asset.value?.toFixed(2) || '0.00'}
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

            <div className={styles.tradeComparisonContainer}>
              <div className={styles.tradeComparisonBarWrapper}>
                <div className={styles.bufferBar} />
                <div
                  className={styles.evenZone}
                  style={{ left: `${50 - 7.5}%`, width: `15%` }}
                />
                <div className={styles.foregroundBar}>
                  {isEvenTrade ? (
                    <div
                      className={styles.teamEvenBar}
                      style={{ width: '15%', left: '42.5%', position: 'absolute' }}
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

        <aside className={styles.rankings}>
          <h2 className={styles.sectionTitle}>Edit Rankings</h2>

          {isClient && (
            <>
              {user ? (
                <div style={{ display: 'flex', gap: '4%', marginBottom: '1rem' }}>
                  {/* Save Rankings Button */}
                  <button
                    className={styles.buttonPrimary}
                    onClick={handleSave}
                    style={{ flex: 1 }}
                  >
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Rankings'}
                  </button>

                  {/* Reset Dropdown Button */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => setShowResetMenu(prev => !prev)}
                      style={{ width: '100%' }}
                    >
                      Reset ▼
                    </button>

                    {showResetMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          width: '100%',
                          backgroundColor: '#222',
                          border: '1px solid #444',
                          zIndex: 10,
                        }}
                      >
                        <button
                          onClick={() => {
                            handleResetRankings();
                            setShowResetMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            textAlign: 'left',
                            color: '#eee',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Reset to Last Save
                        </button>
                        <button
                          onClick={() => {
                            handleResetToDefault();
                            setShowResetMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            textAlign: 'left',
                            color: '#eee',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Reset to Default
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '1rem' }}>
                  Sign in to save your rankings.
                </p>
              )}



              <EditableRankings players={players} onChange={setPlayers} />
            </>
          )}
        </aside>


      </div>
    </div>
  );
}
