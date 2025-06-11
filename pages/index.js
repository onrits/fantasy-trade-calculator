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
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { useRouter } from 'next/router';

export default function Home() {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  const [players, setPlayers] = useState([]);
  const [loadedInitialRankings, setLoadedInitialRankings] = useState(false);
  const [team1Assets, setTeam1Assets] = useState([]);
  const [team2Assets, setTeam2Assets] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const router = useRouter();

  useEffect(() => setIsClient(true), []);

  const normalizePlayers = (data) =>
    data.map((p, index) => ({
      ...p,
      id: `player-${p.Player || p.name}`,
      name: p.Player || p.name,
      value: Number(p.value ?? p.value ?? 0),
      type: 'Player',
      position: p.Position || p.position || '',
      tier: p.tier ?? p.tier ?? null,
      rank: index + 1,
    }));

  useEffect(() => {
    const loadUserRankings = async () => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, 'userRankings', user.uid));
          if (docSnap.exists()) {
            setPlayers(docSnap.data().players || []);
            setLoadedInitialRankings(true);
            return;
          }
        } catch (err) {
          console.error('Failed to load rankings:', err);
        }
      }
      setPlayers(normalizePlayers(playerValues));
      setLoadedInitialRankings(true);
    };

    loadUserRankings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await setDoc(doc(db, 'userRankings', user.uid), { players });
      setSaveSuccess(true);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleResetToDefault = () => {
    setPlayers(normalizePlayers(playerValues));
  };

  const handleResetRankings = async () => {
    try {
      if (!user) return handleResetToDefault();
      const docSnap = await getDoc(doc(db, 'userRankings', user.uid));
      if (docSnap.exists()) {
        setPlayers(docSnap.data().players || []);
      } else {
        handleResetToDefault();
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const draftPickValueMap = useMemo(() => {
    return draftPickValues.reduce((acc, p) => {
      if (p['Draft Pick']) acc[p['Draft Pick']] = Number(p.Value || 0);
      return acc;
    }, {});
  }, []);

  const allItems = useMemo(() => {
    const normalizedPicks = draftPickValues.map(p => ({
      id: `pick-${p['Draft Pick']}`,
      label: p['Draft Pick'],
      value: draftPickValueMap[p['Draft Pick']] || 0,
      type: 'Pick',
      tier: p.tier || p.tier || null,
      season: parseInt(p['Draft Pick']?.split(' ')[0]) || null,
    }));

    const normalizedPlayers = players.map((p, index) => ({
      ...p,
      id: `player-${p.name}`,
      name: p.name,
      value: Number(p.value || 0),
      type: 'Player',
      position: p.position || '',
      tier: p.tier || null,
      rank: index + 1,
    }));

    return [...normalizedPlayers, ...normalizedPicks];
  }, [players, draftPickValueMap]);

  const addToTeam = (teamSetter, assets) => (item) => {
    if (!assets.find(i => i.id === item.id)) {
      teamSetter([...assets, item]);
    }
  };

  const removeFromTeam = (teamSetter, assets) => (id) => {
    teamSetter(assets.filter(i => i.id !== id));
  };

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
      {/* Navigation Menu */}
      <nav style={{ marginBottom: '2rem' }}>
        <ul style={{ display: 'flex', listStyle: 'none', padding: 0, gap: '1.5rem' }}>
          <li>
            <Link href="/" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/rankings">Rankings</Link>
          </li>
        </ul>
      </nav>

      <header className={styles.headerContainer}>
        <h1 className={styles.headerTitle}>TI‑CALC</h1>
        <p className={styles.tagline}>Your Personal Trade Calculator</p>
      </header>

      <div className={styles.authControls}>
        {user ? (
          <>
            <span>Signed in as <strong>{user.displayName || user.email}</strong></span>
            <button onClick={logout} className={styles.buttonSecondary}>Sign Out</button>
          </>
        ) : (
          <button onClick={signInWithGoogle} className={styles.buttonPrimary}>
            Sign In with Google
          </button>
        )}
      </div>

      <main className={styles.mainLayout}>
        <section className={styles.leftColumn}>
          <div className={styles.calculator}>
            {[1, 2].map(team => {
              const assets = team === 1 ? team1Assets : team2Assets;
              const setAssets = team === 1 ? setTeam1Assets : setTeam2Assets;
              const label = `Team ${team}`;
              const teamClass = styles[`team${team}`];

              return (
                <div key={team} className={`${styles.teamBox} ${styles[`team${team}Box`]}`}>
                  <h2 className={styles.teamLabel}>{label}</h2>
                  <TradeInput
                    allItems={allItems}
                    selectedAssets={assets || []}
                    onSelect={addToTeam(setAssets, assets || [])}
                  />
                  <ul className={styles.assetList}>
                    {(assets || []).map(asset => (
                      <li key={asset.id} className={`${styles.assetItem} ${teamClass}`}>
                        <span>
                          {asset.name || asset.label} ({asset.position || asset.type}, Tier {asset.tier ?? '?'}) – {asset.value?.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromTeam(setAssets, assets || [])(asset.id)}
                          className={`${styles.removeButton} ${teamClass}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.teamTotals}>
                    <br /><strong>Total:</strong> {team === 1 ? rawTeam1Total : rawTeam2Total}<br />
                    <strong>Adjusted:</strong> {team === 1 ? adjustedTeam1Total : adjustedTeam2Total}
                  </div>
                </div>
              );
            })}

            {(team1Assets.length || team2Assets.length) > 0 && (
              <div className={styles.tradeComparisonContainer}>
                <div className={styles.tradeComparisonBarWrapper}>
                  <div className={styles.bufferBar} />
                  <div className={styles.evenZone} style={{ left: '42.5%', width: '15%' }} />
                  <div className={styles.foregroundBar}>
                    {isEvenTrade ? (
                      <div className={styles.teamEvenBar} style={{ width: '15%', left: '42.5%' }} />
                    ) : (
                      <>
                        <div className={styles.team1Bar} style={{ width: `${team1Percent}%` }} />
                        <div className={styles.team2Bar} style={{ width: `${team2Percent}%` }} />
                      </>
                    )}
                  </div>
                  <div className={styles.midLine} />
                </div>

                <div className={styles.tradeComparisonLabel}>{winner}</div>

                {!isEvenTrade && (
                  <div className={styles.reasonBox}>
                    <strong>{winner} by {Math.abs(adjustedTeam1Total - adjustedTeam2Total).toFixed(2)} First Round Picks</strong>
                    <p>That’s roughly equivalent to:</p>
                    <ul>
                      {(() => {
                        const valueGap = Math.abs(adjustedTeam1Total - adjustedTeam2Total);
                        const closest = draftPickValues
                          .map(p => ({ label: p['Draft Pick'], value: parseFloat(p.Value) }))
                          .filter(p => !isNaN(p.value))
                          .sort((a, b) => Math.abs(a.value - valueGap) - Math.abs(b.value - valueGap))[0];
                        return closest ? <li>{closest.label} ({closest.value.toFixed(2)})</li> : null;
                      })()}
                    </ul>
                    <p>Consider adding a player or pick worth <strong>{Math.abs(adjustedTeam1Total - adjustedTeam2Total).toFixed(2)}</strong>.</p>
                  </div>
                )}

                {reason && (
                  <div className={styles.reasonBox}>
                    <strong>Adjustments:</strong>
                    <ul className={styles.reasonList}>
                      {(Array.isArray(reason) ? reason : reason.split('.').filter(Boolean)).map((r, i) => (
                        <li key={i}>{r.trim()}.</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <Legend />
        </section>

        <aside className={styles.rankings}>
          <h2 className={styles.sectionTitle}>Edit Rankings</h2>

          {/* More visible generation prompt */}
          <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            Quickly generate new rankings based on your preferences:{' '}
            <button className={styles.buttonPrimary}
              onClick={() => router.push('/rankings')}
            >
              Generate Rankings &raquo;
            </button>
          </p>

          {/* Follow-up about customizing */}
          <p style={{ fontStyle: 'italic', color: '#aaa', marginTop: 0, marginBottom: '1rem' }}>
            Then fine-tune by dragging and dropping players to your liking.
          </p>

          {isClient && loadedInitialRankings && (
            <>
              {user ? (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button className={styles.buttonPrimary} onClick={handleSave}>
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Rankings'}
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => setShowResetMenu(prev => !prev)}
                    >
                      Reset ▼
                    </button>
                    {showResetMenu && (
                      <div className={styles.resetMenu}>
                        <button onClick={() => { handleResetRankings(); setShowResetMenu(false); }}>
                          Reset to Last Save
                        </button>
                        <button onClick={() => { handleResetToDefault(); setShowResetMenu(false); }}>
                          Reset to Default
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>Sign in to save your rankings.</p>
              )}
              <EditableRankings players={players} onChange={setPlayers} />
            </>
          )}
        </aside>


      </main>
    </div>
  );
}
