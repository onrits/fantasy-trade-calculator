// /components/ValueTunerPopup.js
import { useState } from 'react';
import styles from '../styles/ValueTunerPopup.module.css';

// Tier info lookup by tier number
const TIER_INFO = {
    1: { label: 'Prometheus', valueRange: '4+ 1sts', description: 'Are they are worth 4+ First Round Picks?' },
    2: { label: 'Franchise Altering', valueRange: '3+ 1sts', description: 'Are they are worth 3+ First Round Picks?' },
    3: { label: 'Cornerstones', valueRange: '2-3 1sts', description: 'Are they are worth 2-3 First Round Picks?' },
    4: { label: 'Portfolio Pillars', valueRange: '2+ 1sts', description: 'Are they are worth 2+ First Round Picks?' },
    5: { label: 'Hopeful Elites', valueRange: '1-2 1sts', description: 'Are they are worth 1-2 First Round Picks?' },
    6: { label: 'Kind of Exciting', valueRange: '1st+', description: 'Are they are worth a bit more than a First Round Pick?' },
    7: { label: 'Solid Pieces', valueRange: 'Late 1st', description: 'Are they are worth about a First Round Pick?' },
    8: { label: 'Bridge Players', valueRange: 'Early 2nd', description: 'Are they are worth an Early 2nd Round Pick?' },
    9: { label: 'Rentals', valueRange: 'Mid 2nd', description: 'Are they are worth a Mid 2nd Round Pick?' },
    10: { label: 'Bench Fodder', valueRange: 'Mid 3rd', description: 'Are they are worth a Mid 3rd Round Pick?' },
    11: { label: 'Roster Cloggers', valueRange: 'Mid 4th', description: 'Are they are worth a 4th Round Pick' },
};



const MIN_TIER = 1;
const MAX_TIER = 11;

// Map tier adjustment choice to tier delta
const ADJUSTMENTS = {
    'wayLower': 2,
    'lower': 1,
    'aboutRight': 0,
    'higher': -1,
    'wayHigher': -2,
};

export default function ValueTunerPopup({ players, onClose, onSave }) {

    const [currentIndex, setCurrentIndex] = useState(0);
    // Copy players to local state for editing
    const [tunedPlayers, setTunedPlayers] = useState(() =>
        players.map(p => ({ ...p })) // shallow copy to avoid mutating props
    );
    // Track user selections per player, default to 'aboutRight'
    const [adjustments, setAdjustments] = useState(() =>
        players.map(() => 'aboutRight')
    );

    if (!players || players.length === 0) return null;

    const currentPlayer = tunedPlayers[currentIndex];
    const currentAdjustment = adjustments[currentIndex];

    // Clamp tier to valid range and update value to midpoint of tier range (simplified)
    function getTierValue(tier) {
        // Approximate value per tier midpoint:
        // Using average of the ranges from your tier table
        const tierMidpoints = {
            1: 4.2,
            2: 3.65,
            3: 3.0,
            4: 2.415,
            5: 1.915,
            6: 1.5,
            7: 1.165,
            8: 0.83,
            9: 0.495,
            10: 0.21,
            11: 0.05,
        };
        return tierMidpoints[tier] || 0;
    }

    function handleAdjustmentChange(e) {
        const choice = e.target.value;
        setAdjustments((adj) => {
            const newAdj = [...adj];
            newAdj[currentIndex] = choice;
            return newAdj;
        });
    }

    function applyAdjustmentToPlayer(index) {
        const adj = adjustments[index];
        const delta = ADJUSTMENTS[adj] || 0;
        let newTier = tunedPlayers[index].tier + delta;

        if (newTier < MIN_TIER) newTier = MIN_TIER;
        if (newTier > MAX_TIER) newTier = MAX_TIER;

        const newValue = getTierValue(newTier);

        setTunedPlayers((players) => {
            const updated = [...players];
            updated[index] = {
                ...updated[index],
                tier: newTier,
                value: newValue,
            };
            return updated;
        });
    }

    function handleNext() {
        // Save adjustment for current player before moving on
        applyAdjustmentToPlayer(currentIndex);

        if (currentIndex < tunedPlayers.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    }

    function handleBack() {
        // Save adjustment for current player before moving back
        applyAdjustmentToPlayer(currentIndex);

        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    }

    function handleSave() {
        // Apply adjustment to current player before saving
        applyAdjustmentToPlayer(currentIndex);

        // Give a tiny delay to ensure setState is complete
        setTimeout(() => {
            onSave(tunedPlayers);
        }, 50);
    }

    function handleCancel() {
        onClose();
    }

    function handleDone() {
        // Apply adjustment to current player before finishing
        applyAdjustmentToPlayer(currentIndex);

        setTimeout(() => {
            onSave(tunedPlayers);
        }, 50);
    }


    const tierInfo = TIER_INFO[currentPlayer.tier] || {};

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <h2>Fine Tune Player Value</h2>

                <div className={styles.playerName}>{currentPlayer.Player}</div>

                <div>
                    Current Tier: <strong>{currentPlayer.tier} — {tierInfo.label}</strong>
                </div>
                <div>
                    Value: <strong>{currentPlayer.value.toFixed(2)}</strong> (~{tierInfo.valueRange})
                </div>
                <div className={styles.description}>{tierInfo.description}</div>

                <form className={styles.options}>
                    <label>
                        <input
                            type="radio"
                            name="adjustment"
                            value="wayLower"
                            checked={currentAdjustment === 'wayLower'}
                            onChange={handleAdjustmentChange}
                        />
                        Worth Much Less (-2 tiers)
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="adjustment"
                            value="lower"
                            checked={currentAdjustment === 'lower'}
                            onChange={handleAdjustmentChange}
                        />
                        Worth Less (-1 tier)
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="adjustment"
                            value="aboutRight"
                            checked={currentAdjustment === 'aboutRight'}
                            onChange={handleAdjustmentChange}
                        />
                        About Right (No Change)
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="adjustment"
                            value="higher"
                            checked={currentAdjustment === 'higher'}
                            onChange={handleAdjustmentChange}
                        />
                        Worth More (+1 tier)
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="adjustment"
                            value="wayHigher"
                            checked={currentAdjustment === 'wayHigher'}
                            onChange={handleAdjustmentChange}
                        />
                        Worth Much More (+2 tiers)
                    </label>
                </form>

                <div className={styles.buttonRow}>
                    <button onClick={handleBack} disabled={currentIndex === 0} className={styles.buttonSecondary}>
                        Back
                    </button>

                    {currentIndex < tunedPlayers.length - 1 && (
                        <button onClick={handleNext} className={styles.buttonPrimary}>
                            Next
                        </button>
                    )}

                    <button onClick={handleDone} className={styles.buttonSuccess}>
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