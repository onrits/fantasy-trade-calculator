// /pages/rankings.js

import { useState, useEffect, useCallback } from 'react';
import EditableRankings from '../components/EditableRankings';
import EasySetup from '../components/EasySetup';
import ValueTunerPopup from '../components/ValueTunerPopup';
import playerValues from '../data/playerValues.json';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import styles from '../styles/Home.module.css';
import Link from 'next/link';
import valuetunerStyles from '../styles/ValueTunerPopup.module.css';


// Define tier boundaries (example data - adjust as needed)
const tierBoundaries = [
    { tier: 1, minRank: 1, maxRank: 3 },
    { tier: 2, minRank: 2, maxRank: 9 },
    { tier: 3, minRank: 8, maxRank: 23 },
    { tier: 4, minRank: 23, maxRank: 35 },
    { tier: 5, minRank: 36, maxRank: 50 },
    { tier: 6, minRank: 51, maxRank: 72 },
    { tier: 7, minRank: 73, maxRank: 84 },
    { tier: 8, minRank: 84, maxRank: 100 },
    { tier: 9, minRank: 101, maxRank: 125 },
    { tier: 10, minRank: 125, maxRank: 160 },
    { tier: 11, minRank: 161, maxRank: 9999 }, // catch-all lower tier
];

// Find which tier a given rank belongs to
function findTierForRank(rank) {
    return tierBoundaries.find(({ minRank, maxRank }) => rank >= minRank && rank <= maxRank);
}

const tierValueRanges = {
    1: { min: 4.1, max: 4.5 },
    2: { min: 3.3, max: 4.0 },
    3: { min: 2.67, max: 3.33 },
    4: { min: 2.17, max: 2.66 },
    5: { min: 1.67, max: 2.16 },
    6: { min: 1.34, max: 1.66 },
    7: { min: 1.0, max: 1.33 },
    8: { min: 0.67, max: 0.99 },
    9: { min: 0.33, max: 0.66 },
    10: { min: 0.1, max: 0.32 },
    11: { min: 0, max: 0.1 },
};

const dropdownStyle = {
    width: '100%',
    padding: '0.5rem',
    textAlign: 'left',
    color: '#eee',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
};

function interpolateValue(rank, tierInfo) {
    if (!tierInfo) return 0;
    const { minRank, maxRank, tier } = tierInfo;
    const range = maxRank - minRank + 1;
    const positionInTier = rank - minRank;

    const { min, max } = tierValueRanges[tier] || { min: 0, max: 0 };

    // Interpolate between min and max for this tier, descending as rank increases
    return max - (positionInTier / range) * (max - min);
}

function updatePlayersRanksAndTiers(players, { skipTiers = false } = {}) {
    const sortedPlayers = [...players].sort((a, b) => b.value - a.value);

    return sortedPlayers.map((player, index) => {
        const rank = index + 1;

        let tier = player.tier; // default: keep the existing tier
        let interpolatedValue = player.value;

        if (!skipTiers) {
            const tierInfo = findTierForRank(rank);
            tier = tierInfo ? tierInfo.tier : 11;
            interpolatedValue = interpolateValue(rank, tierInfo);
        }

        return {
            ...player,
            Rank: rank,
            tier,
            value: interpolatedValue,
        };
    });
}

export default function Rankings() {
    const [players, setPlayers] = useState([]);
    const { user, signInWithGoogle } = useAuth();

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showResetMenu, setShowResetMenu] = useState(false);
    const [setupDone, setSetupDone] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    const [showValueTuner, setShowValueTuner] = useState(false);
    const [tunedPlayers, setTunedPlayers] = useState([]);
    const [seenPlayers, setSeenPlayers] = useState([]);
    const [adjustments, setAdjustments] = useState([]);

    // NEW: toggle to show only outliers
    const [showOutliersOnly, setShowOutliersOnly] = useState(false);
    const [showOutlierPopup, setShowOutlierPopup] = useState(false);


    useEffect(() => {
        setTunedPlayers(players.map(p => ({ ...p })));
        setSeenPlayers(players.map(() => false));
        setAdjustments(players.map(() => null));
    }, [players]);

    useEffect(() => {
        if (user && !setupDone) {
            const loadUserRankings = async () => {
                try {
                    const docRef = doc(db, 'userRankings', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const loadedPlayers = docSnap.data().players;
                        const normalizedPlayers = loadedPlayers.map((p, idx) => ({
                            ...p,
                            tier: p.tier ?? 11,
                            value: p.value ?? 0,
                            Rank: idx + 1,
                        }));

                        setPlayers(normalizedPlayers);
                        setSetupDone(true);
                        setUnsavedChanges(false);
                    }
                } catch (error) {
                    console.error('Error loading user rankings:', error);
                }
            };
            loadUserRankings();
        }
    }, [user, setupDone]);

    const confirmDiscardChanges = () => {
        if (unsavedChanges) {
            return window.confirm('You have unsaved changes. Are you sure you want to discard them?');
        }
        return true;
    };

    const handleClearSavedRankings = async () => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'userRankings', user.uid));
            setPlayers([]);
            setSetupDone(false);
            setUnsavedChanges(false);
        } catch (error) {
            console.error('Error clearing saved rankings:', error);
        }
    };

    const generateBaseRankings = async (weights) => {
        console.log('Generating rankings with weights:', weights);

        const sliders = weights.sliders || {};
        const positionWeights = weights.positionWeights || { QB: 1, RB: 1, WR: 1, TE: 1 };

        let basePlayers = playerValues.map((p) => {
            const ageScore = (p["Age Score"] ?? 0) / 10;
            const productionScore = (p["Production Score"] ?? 0) / 10;
            const projectedScore = (p["Projected Score"] ?? 0) / 10;
            const valueScore = (p["Value Score"] ?? 0) / 10;

            const posWeight = positionWeights[p.Pos] ?? 1;

            const score =
                (sliders.ageWeight ?? 0) * ageScore +
                (sliders.productionWeight ?? 0) * productionScore +
                (sliders.projectedWeight ?? 0) * projectedScore +
                (sliders.valueWeight ?? 0) * valueScore;

            const finalScore = score * posWeight;

            return {
                ...p,
                id: `player-${p.Player}`,
                name: p.Player,
                position: p.Pos || '',
                rawScore: finalScore,
            };
        });

        basePlayers.sort((a, b) => b.rawScore - a.rawScore);

        basePlayers = basePlayers.map((player, index) => {
            const rank = index + 1;
            const tierInfo = findTierForRank(rank);
            const tier = tierInfo ? tierInfo.tier : 11;
            const value = interpolateValue(rank, tierInfo);

            return {
                ...player,
                tier,
                value,
                Rank: rank,
            };
        });

        if (user) {
            try {
                const docRef = doc(db, 'userRankings', user.uid);
                const playersToSave = basePlayers.map(p => ({
                    ...p,
                    tier: p.tier,
                    value: p.value,
                    Rank: p.Rank,
                }));
                await setDoc(docRef, { players: playersToSave });
            } catch (error) {
                console.error('Error saving generated rankings:', error);
            }
        }

        setPlayers(basePlayers);
        setSetupDone(true);
        setUnsavedChanges(false);
        setShowValueTuner(true);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const docRef = doc(db, 'userRankings', user.uid);

            const playersToSave = players.map((p, index) => {
                const { tier, value, ...rest } = p;
                return {
                    ...rest,
                    tier: p.tier,
                    value: p.value,
                    Rank: index + 1,
                };
            });

            await setDoc(docRef, { players: playersToSave });
            setPlayers(playersToSave);

            setSaveSuccess(true);
            setUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving rankings:', error);
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveSuccess(false), 2000);
        }
    };

    const handleResetRankings = async () => {
        if (!confirmDiscardChanges()) return;

        if (user) {
            try {
                const docRef = doc(db, 'userRankings', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const loadedPlayers = docSnap.data().players;

                    const normalizedPlayers = loadedPlayers.map((p, idx) => ({
                        ...p,
                        tier: p.tier ?? 11,
                        value: p.value ?? 0,
                        Rank: idx + 1,
                    }));

                    setPlayers(normalizedPlayers);
                    setSetupDone(true);
                    setUnsavedChanges(false);
                } else {
                    setSetupDone(false);
                    setPlayers([]);
                    setUnsavedChanges(false);
                }
            } catch (error) {
                console.error('Error resetting rankings:', error);
            }
        } else {
            setSetupDone(false);
            setPlayers([]);
            setUnsavedChanges(false);
        }
    };

    const handleResetToDefault = () => {
        if (!confirmDiscardChanges()) return;

        const defaultPlayers = playerValues.map((p) => ({
            ...p,
            id: `player-${p.Player}`,
            name: p.Player,
            value: p.value || 0,
            type: 'Player',
            position: p.Position || '',
            tier: p.tier || null,
        }));
        setPlayers(defaultPlayers);
        setSetupDone(true);
        setUnsavedChanges(false);
    };

    const handlePlayersChange = (newPlayers) => {
        setPlayers(newPlayers);
        setUnsavedChanges(true);
    };

    const handleValueTunerSave = (updatedPlayers) => {
        const updatedAndSortedPlayers = updatePlayersRanksAndTiers(updatedPlayers, { skipTiers: true });

        setPlayers(updatedAndSortedPlayers);
        setUnsavedChanges(true);
        setShowValueTuner(false);
    };

    // Outlier detection threshold for value difference
    const OUTLIER_VALUE_DIFF_THRESHOLD = 0.5;

    // Filtered players based on outliers toggle
    const filteredPlayers = players;


    const HIGH_ON = [];
    const LOW_ON = [];

    players.forEach((player) => {
        const marketPlayer = playerValues.find(p => p.Player === player.name);
        if (!marketPlayer) return;

        const delta = +(player.value - (marketPlayer.value ?? 0)).toFixed(2);

        if (delta >= OUTLIER_VALUE_DIFF_THRESHOLD) {
            HIGH_ON.push({ name: player.name, delta });
        } else if (delta <= -OUTLIER_VALUE_DIFF_THRESHOLD) {
            LOW_ON.push({ name: player.name, delta });
        }
    });

    const topHighOn = HIGH_ON.sort((a, b) => b.delta - a.delta).slice(0, 5);
    const topLowOn = LOW_ON.sort((a, b) => a.delta - b.delta).slice(0, 5);

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.homeLink}>
                ← Back to Home
            </Link>

            <h1>Edit Rankings</h1>
            <p>
                Drag and drop to customize your rankings, or use the Tier Wizard to fine-tune one by one.
            </p>
            <br />

            {!setupDone ? (
                user ? (
                    <EasySetup onComplete={generateBaseRankings} />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0 }}>
                            Sign in to generate your rankings.
                        </p>
                        <button onClick={signInWithGoogle} className={styles.buttonPrimary}>
                            Sign In with Google
                        </button>
                    </div>
                )
            ) : (
                <>
                    {user ? (
                        <>
                            <div style={{ display: 'flex', gap: '2%', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    className={styles.buttonPrimary}
                                    onClick={handleSave}
                                    disabled={!unsavedChanges || isSaving}
                                    style={{ flex: '1 1 150px' }}
                                >
                                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Rankings'}
                                </button>

                                <button
                                    className={styles.buttonSecondary}
                                    onClick={() => setShowValueTuner(true)}
                                    style={{ flex: '1 1 150px' }}
                                >
                                    Tiers Wizard
                                </button>

                                <button
                                    className={styles.buttonSecondary}
                                    onClick={() => setShowOutlierPopup(true)}
                                    style={{ flex: '1 1 150px' }}
                                >
                                    View Outlier Summary
                                </button>



                                <div style={{ position: 'relative', flex: '1 1 150px' }}>
                                    <button
                                        className={styles.buttonSecondary}
                                        onClick={() => setShowResetMenu((prev) => !prev)}
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
                                                style={dropdownStyle}
                                            >
                                                Reset to Last Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleResetToDefault();
                                                    setShowResetMenu(false);
                                                }}
                                                style={{ ...dropdownStyle, borderTop: '1px solid #444' }}
                                            >
                                                Reset to Default
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleClearSavedRankings();
                                                    setShowResetMenu(false);
                                                }}
                                                style={{ ...dropdownStyle, borderTop: '1px solid #444' }}
                                            >
                                                Generate New Rankings
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {unsavedChanges && (
                                <p style={{ color: '#f39c12', fontStyle: 'italic', marginBottom: '1rem' }}>
                                    You have unsaved changes. Don’t forget to save!
                                </p>
                            )}
                        </>
                    ) : (
                        <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '1rem' }}>
                            Sign in to save your rankings.
                        </p>
                    )}

                    <h2 className={styles.sectionTitle}>Your Rankings</h2>

                    {filteredPlayers.length === 0 ? (
                        <p>
                            No rankings to display.{' '}
                            {showOutliersOnly ? 'No outliers found.' : 'Generate or import rankings.'}
                        </p>
                    ) : (
                        <EditableRankings players={filteredPlayers} onChange={handlePlayersChange} />
                    )}
                </>
            )}

            {showValueTuner && (
                <ValueTunerPopup
                    tunedPlayers={tunedPlayers}
                    setTunedPlayers={setTunedPlayers}
                    seenPlayers={seenPlayers}
                    setSeenPlayers={setSeenPlayers}
                    adjustments={adjustments}
                    setAdjustments={setAdjustments}
                    onClose={() => setShowValueTuner(false)}
                    onSave={handleValueTunerSave}
                />
            )}

            {showOutlierPopup && (
                <div className={valuetunerStyles.overlay}>
                    <div className={valuetunerStyles.popup}>
                        <h2 className={valuetunerStyles.h2}>Outlier Summary</h2>

                        <h3>📈 Players You’re High On</h3>
                        {topHighOn.length > 0 ? (
                            <ul className={valuetunerStyles.outlierList}>
                                {topHighOn.map((p) => (
                                    <li key={p.name} className={valuetunerStyles.outlierItemHigh}>
                                        {p.name} <span className={valuetunerStyles.outlierDelta}>(+{p.delta})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={valuetunerStyles.description} style={{ fontStyle: 'italic', color: '#555' }}>
                                No significant highs
                            </p>
                        )}

                        <h3 style={{ marginTop: '1rem' }}>📉 Players You’re Low On</h3>
                        {topLowOn.length > 0 ? (
                            <ul className={valuetunerStyles.outlierList}>
                                {topLowOn.map((p) => (
                                    <li key={p.name} className={valuetunerStyles.outlierItemLow}>
                                        {p.name} <span className={valuetunerStyles.outlierDelta}>({p.delta})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={valuetunerStyles.description} style={{ fontStyle: 'italic', color: '#555' }}>
                                No significant lows
                            </p>
                        )}

                        <button
                            onClick={() => setShowOutlierPopup(false)}
                            className={valuetunerStyles.buttonSecondary}
                            style={{ marginTop: '2rem' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}


        </div>
    );

}