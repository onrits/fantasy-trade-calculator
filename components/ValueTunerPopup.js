import { useState, useEffect, useRef } from 'react';
import styles from '../styles/ValueTunerPopup.module.css';

const TIER_INFO = {
    1: { label: 'Prometheus', valueRange: '4+ 1sts', description: 'Are they worth 4+ First Round Picks?' },
    2: { label: 'Franchise Altering', valueRange: '3+ 1sts', description: 'Are they worth 3+ First Round Picks?' },
    3: { label: 'Cornerstones', valueRange: '2-3 1sts', description: 'Are they worth 2-3 First Round Picks?' },
    4: { label: 'Portfolio Pillars', valueRange: '2+ 1sts', description: 'Are they worth 2+ First Round Picks?' },
    5: { label: 'Hopeful Elites', valueRange: '1-2 1sts', description: 'Are they worth 1-2 First Round Picks?' },
    6: { label: 'Kind of Exciting', valueRange: '1st+', description: 'Are they worth a bit more than a First Round Pick?' },
    7: { label: 'Solid Pieces', valueRange: 'Late 1st', description: 'Are they worth about a First Round Pick?' },
    8: { label: 'Bridge Players', valueRange: 'Early 2nd', description: 'Are they worth an Early 2nd Round Pick?' },
    9: { label: 'Rentals', valueRange: 'Mid 2nd', description: 'Are they worth a Mid 2nd Round Pick?' },
    10: { label: 'Bench Fodder', valueRange: 'Mid 3rd', description: 'Are they worth a Mid 3rd Round Pick?' },
    11: { label: 'Roster Cloggers', valueRange: 'Mid 4th', description: 'Are they worth a 4th Round Pick' },
};

const MIN_TIER = 1;
const MAX_TIER = 11;

const ADJUSTMENTS = {
    wayLower: 2,
    lower: 1,
    aboutRight: 0,
    higher: -1,
    wayHigher: -2,
};

export default function ValueTunerPopup({
    tunedPlayers,
    setTunedPlayers,
    seenPlayers,
    setSeenPlayers,
    adjustments,
    setAdjustments,
    onClose,
    onSave,
}) {
    const [skipAboutRights, setSkipAboutRights] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const hasInitialized = useRef(false);

    // Load saved adjustments and seenPlayers from localStorage once on mount
    useEffect(() => {
        if (hasInitialized.current) return;

        try {
            const savedAdjustments = JSON.parse(localStorage.getItem('adjustments') || '[]');
            const savedSeenPlayers = JSON.parse(localStorage.getItem('seenPlayers') || '[]');

            if (savedAdjustments.length === tunedPlayers.length && savedSeenPlayers.length === tunedPlayers.length) {
                setAdjustments(savedAdjustments);
                setSeenPlayers(savedSeenPlayers);

                const firstIndex = savedAdjustments.findIndex(
                    (adj, i) => !(adj === 'aboutRight' && savedSeenPlayers[i])
                );

                setCurrentIndex(firstIndex === -1 ? 0 : firstIndex);
            } else {
                setAdjustments(Array(tunedPlayers.length).fill(null));
                setSeenPlayers(Array(tunedPlayers.length).fill(false));
                setCurrentIndex(0);
            }
        } catch (e) {
            setAdjustments(Array(tunedPlayers.length).fill(null));
            setSeenPlayers(Array(tunedPlayers.length).fill(false));
            setCurrentIndex(0);
        }

        hasInitialized.current = true;
    }, [tunedPlayers, setAdjustments, setSeenPlayers]);

    if (!tunedPlayers || tunedPlayers.length === 0) return null;

    const currentPlayer = tunedPlayers[currentIndex];
    const currentAdjustment = adjustments[currentIndex];

    const tierMidpoints = {
        1: { min: 4.0, max: 4.5 },
        2: { min: 3.3, max: 4.0 },
        3: { min: 2.67, max: 3.33 },
        4: { min: 2.17, max: 2.66 },
        5: { min: 1.67, max: 2.16 },
        6: { min: 1.34, max: 1.66 },
        7: { min: 1.0, max: 1.33 },
        8: { min: 0.67, max: 0.99 },
        9: { min: 0.33, max: 0.66 },
        10: { min: 0.1, max: 0.32 },
        11: { min: 0.01, max: 0.09 },
    };

    const getTierValue = (tier, index, allPlayers) => {
        const range = tierMidpoints[tier];
        if (!range) return 0;

        // Get all players in this tier
        const playersInTier = allPlayers
            .map((p, i) => ({ ...p, i }))
            .filter((p) => p.tier === tier);

        if (playersInTier.length === 1) return (range.min + range.max) / 2;

        // Sort by original order (or you can change to sort by p.Player if needed)
        playersInTier.sort((a, b) => a.i - b.i);

        const position = playersInTier.findIndex((p) => p.i === index);
        const pct = position / (playersInTier.length - 1);

        const value = range.max - pct * (range.max - range.min);
        return parseFloat(value.toFixed(3));
    };


    const applyAdjustmentToPlayer = (index) => {
        const adj = adjustments[index];
        if (!adj) return;

        const delta = ADJUSTMENTS[adj] || 0;
        let newTier = tunedPlayers[index].tier + delta;
        newTier = Math.max(MIN_TIER, Math.min(MAX_TIER, newTier));
        const newValue = getTierValue(newTier, index, tunedPlayers);


        setTunedPlayers((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                tier: newTier,
                value: newValue,
            };
            return updated;
        });
    };

    const markPlayerSeen = (index) => {
        const updated = [...seenPlayers];
        updated[index] = true;
        setSeenPlayers(updated);

        // Also save to localStorage so subsequent sessions can read it
        localStorage.setItem('seenPlayers', JSON.stringify(updated));
        localStorage.setItem('adjustments', JSON.stringify(adjustments));

        return updated;
    };

    const handleAdjustmentChange = (e) => {
        const choice = e.target.value;
        setAdjustments((prev) => {
            const updated = [...prev];
            updated[currentIndex] = choice;

            // Save to localStorage immediately so data is fresh
            localStorage.setItem('adjustments', JSON.stringify(updated));

            return updated;
        });
    };

    const goToNextUnseenPlayer = (startIndex) => {
        let nextIndex = startIndex + 1;
        while (
            skipAboutRights &&
            nextIndex < tunedPlayers.length &&
            adjustments[nextIndex] === 'aboutRight' &&
            seenPlayers[nextIndex]
        ) {
            nextIndex++;
        }
        return nextIndex < tunedPlayers.length ? nextIndex : startIndex;
    };

    const goToPrevUnseenPlayer = (startIndex) => {
        let prevIndex = startIndex - 1;
        while (
            skipAboutRights &&
            prevIndex >= 0 &&
            adjustments[prevIndex] === 'aboutRight' &&
            seenPlayers[prevIndex]
        ) {
            prevIndex--;
        }
        return prevIndex >= 0 ? prevIndex : startIndex;
    };

    const handleNext = () => {
        if (adjustments[currentIndex] === null) return;

        applyAdjustmentToPlayer(currentIndex);
        const updatedSeen = markPlayerSeen(currentIndex);

        const nextIndex = goToNextUnseenPlayer(currentIndex);
        setCurrentIndex(nextIndex);
    };

    const handleBack = () => {
        if (adjustments[currentIndex] === null) return;

        applyAdjustmentToPlayer(currentIndex);
        markPlayerSeen(currentIndex);

        const prevIndex = goToPrevUnseenPlayer(currentIndex);
        setCurrentIndex(prevIndex);
    };

    const handleDone = () => {
        if (adjustments[currentIndex] === null) return;

        applyAdjustmentToPlayer(currentIndex);
        markPlayerSeen(currentIndex);

        setTimeout(() => onSave(tunedPlayers), 50);
    };

    const handleSave = () => {
        if (adjustments[currentIndex] !== null) {
            applyAdjustmentToPlayer(currentIndex);
        }
        setTimeout(() => onSave(tunedPlayers), 50);
    };

    const handleCancel = () => onClose();

    const tierInfo = TIER_INFO[currentPlayer.tier] || {};

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h2>Fine Tune Player Value</h2>

                <div className={styles.skipToggle}>
                    <label style={{ display: 'block', marginTop: '1rem' }}>
                        <input
                            type="checkbox"
                            checked={skipAboutRights}
                            onChange={(e) => setSkipAboutRights(e.target.checked)}
                        />
                        Skip players marked "About Right" that I've already reviewed
                    </label>
                </div>

                <div className={styles.playerName}>{currentPlayer.Player}</div>
                <div>
                    Current Tier: <strong>{currentPlayer.tier} — {tierInfo.label}</strong>
                </div>
                <div>
                    Value: <strong>{currentPlayer.value.toFixed(2)}</strong> (~{tierInfo.valueRange})
                </div>
                <div className={styles.description}>{tierInfo.description}</div>

                <form className={styles.options}>
                    {['wayLower', 'lower', 'aboutRight', 'higher', 'wayHigher'].map((val) => (
                        <label key={val}>
                            <input
                                type="radio"
                                name="adjustment"
                                value={val}
                                checked={currentAdjustment === val}
                                onChange={handleAdjustmentChange}
                            />
                            {val === 'wayLower' && 'Worth Much Less (-2 tiers)'}
                            {val === 'lower' && 'Worth Less (-1 tier)'}
                            {val === 'aboutRight' && 'About Right (No Change)'}
                            {val === 'higher' && 'Worth More (+1 tier)'}
                            {val === 'wayHigher' && 'Worth Much More (+2 tiers)'}
                        </label>
                    ))}
                </form>

                <div className={styles.buttonRow}>
                    <button onClick={handleBack} disabled={currentIndex === 0} className={styles.buttonSecondary}>
                        Back
                    </button>

                    {currentIndex < tunedPlayers.length - 1 && (
                        <button
                            onClick={handleNext}
                            className={styles.buttonPrimary}
                            disabled={adjustments[currentIndex] === null}
                        >
                            Next
                        </button>
                    )}

                    <button
                        onClick={handleDone}
                        className={styles.buttonSuccess}
                        disabled={adjustments[currentIndex] === null}
                    >
                        Done
                    </button>

                    {currentIndex === tunedPlayers.length - 1 && (
                        <button onClick={handleSave} className={styles.buttonPrimary}>
                            Save
                        </button>
                    )}

                    <button onClick={handleCancel} className={styles.buttonSecondary}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
