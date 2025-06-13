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

    // NEW STATE: show/hide the ValueTunerPopup modal
    const [showValueTuner, setShowValueTuner] = useState(false);

    // Initialize tunedPlayers, seenPlayers, adjustments based on players
    const [tunedPlayers, setTunedPlayers] = useState([]);
    const [seenPlayers, setSeenPlayers] = useState([]);
    const [adjustments, setAdjustments] = useState([]);

    // Sync tunedPlayers, seenPlayers, and adjustments when players change
    useEffect(() => {
        setTunedPlayers(players.map(p => ({ ...p })));
        setSeenPlayers(players.map(() => false));
        setAdjustments(players.map(() => null));
    }, [players]);

    // Load saved rankings from Firestore on user or setupDone change
    useEffect(() => {
        if (user && !setupDone) {
            const loadUserRankings = async () => {
                try {
                    const docRef = doc(db, 'userRankings', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const loadedPlayers = docSnap.data().players;

                        // Normalize casing and fix ranks
                        const normalizedPlayers = loadedPlayers.map((p, idx) => ({
                            ...p,
                            tier: p.tier ?? 11,
                            value: p.value ?? 0,
                            Rank: idx + 1,  // recalc rank by position in list
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

    // Helper to confirm discard if unsaved changes exist
    const confirmDiscardChanges = () => {
        if (unsavedChanges) {
            return window.confirm('You have unsaved changes. Are you sure you want to discard them?');
        }
        return true;
    };

    // Clear saved rankings in Firestore & reset local state
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

    // Generate rankings based on sliders/weights from EasySetup
    const generateBaseRankings = async (weights) => {
        console.log('Generating rankings with weights:', weights);

        const sliders = weights.sliders || {};
        const positionWeights = weights.positionWeights || {
            QB: 1,
            RB: 1,
            WR: 1,
            TE: 1,
        };

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

        // Sort descending by computed score
        basePlayers.sort((a, b) => b.rawScore - a.rawScore);

        // Add tier, interpolated value, and rank info
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

        // Save to Firestore & update local state
        if (user) {
            try {
                const docRef = doc(db, 'userRankings', user.uid);

                const playersToSave = basePlayers.map(p => {
                    const { tier, value, ...rest } = p;
                    return {
                        ...rest,
                        tier: p.tier,
                        value: p.value,
                        Rank: p.Rank,
                    };
                });

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

    // Save current rankings to Firestore
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

    // Reset rankings to last saved state in Firestore
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

    // Reset to default players from playerValues.json
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

    // Whenever players change, mark unsavedChanges true unless just loaded or saved
    const handlePlayersChange = (newPlayers) => {
        setPlayers(newPlayers);
        setUnsavedChanges(true);
    };

    // CALLBACK when ValueTunerPopup finishes tuning and returns updated players
    const handleValueTunerSave = (updatedPlayers) => {
        const updatedAndSortedPlayers = updatePlayersRanksAndTiers(updatedPlayers, { skipTiers: true });

        setPlayers(updatedAndSortedPlayers);
        setUnsavedChanges(true);
        setShowValueTuner(false);
    };

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.homeLink}>
                ← Back to Home
            </Link>

            <h1>Edit Rankings</h1>
            <p>Drag and drop to customize your rankings, or use the Tier Wizard to fine-tune one by one.</p> <br />

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
                            <div style={{ display: 'flex', gap: '4%', marginBottom: '1rem' }}>
                                <button
                                    className={styles.buttonPrimary}
                                    onClick={handleSave}
                                    disabled={!unsavedChanges || isSaving}
                                    style={{ flex: 1 }}
                                >
                                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Rankings'}
                                </button>

                                <button
                                    className={styles.buttonSecondary}
                                    onClick={() => setShowValueTuner(true)}
                                    style={{ flex: 1 }}
                                >
                                    Tiers Wizard
                                </button>

                                <div style={{ position: 'relative', flex: 1 }}>
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
                                                    borderTop: '1px solid #444',
                                                }}
                                            >
                                                Reset to Default
                                            </button>

                                            <button
                                                onClick={() => {
                                                    handleClearSavedRankings();
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
                                                    borderTop: '1px solid #444',
                                                }}
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

                    {players.length === 0 ? (
                        <p>No rankings yet. Generate or import rankings.</p>
                    ) : (
                        <EditableRankings players={players} onChange={handlePlayersChange} />
                    )}
                </>
            )}

            {/* Render ValueTunerPopup modal */}
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
        </div>
    );
}
