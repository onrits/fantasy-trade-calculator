import { useState } from 'react';
import styles from '../styles/EasySetup.module.css'; // assuming you're using CSS Modules

const PRESETS = {
    youth: { label: "Youth Focused", sliders: { ageWeight: 0.9, productionWeight: 0.3, projectedWeight: 0.6, valueWeight: 0.5 }, positionWeights: { QB: 0.6, RB: 0.8, WR: 1.0, TE: 0.4 } },
    contender: { label: "Contender", sliders: { ageWeight: 0.3, productionWeight: 0.9, projectedWeight: 0.9, valueWeight: 0.7 }, positionWeights: { QB: 0.9, RB: 1.0, WR: 0.8, TE: 0.7 } },
    balanced: { label: "Balanced", sliders: { ageWeight: 0.5, productionWeight: 0.5, projectedWeight: 0.5, valueWeight: 0.5 }, positionWeights: { QB: 0.8, RB: 0.8, WR: 0.8, TE: 0.6 } },
    riskAverse: { label: "All Value", sliders: { ageWeight: 0.7, productionWeight: 0.3, projectedWeight: 0.6, valueWeight: 0.9 }, positionWeights: { QB: 0.9, RB: 0.4, WR: 0.9, TE: 0.3 } },
    upsideChaser: { label: "Upside Chaser", sliders: { ageWeight: 0.8, productionWeight: 0.2, projectedWeight: 0.7, valueWeight: 0.3 }, positionWeights: { QB: 0.8, RB: 0.3, WR: 0.9, TE: 0.2 } },
};

const SLIDER_LABELS = {
    ageWeight: "Age",
    productionWeight: "Historical Production",
    projectedWeight: "Projected Production",
    valueWeight: "Market Value",
};

const SLIDER_TOOLTIPS = {
    ageWeight: "Younger players score higher, based on position-specific age tiers.",
    productionWeight: "Based on total WAR and WAR per Game over the past 3 seasons.",
    projectedWeight: "Based on ADP for the upcoming season.",
    valueWeight: "Consensus dynasty market trade value from multiple sources.",
};


export default function EasySetup({ onComplete }) {
    const [selectedPreset, setSelectedPreset] = useState('balanced');
    const [sliders, setSliders] = useState(PRESETS[selectedPreset].sliders);
    const [positionWeights, setPositionWeights] = useState(PRESETS[selectedPreset].positionWeights);

    const handlePresetChange = (preset) => {
        setSelectedPreset(preset);
        setSliders(PRESETS[preset].sliders);
        setPositionWeights(PRESETS[preset].positionWeights);
    };

    const handleSliderChange = (e) => {
        const { name, value } = e.target;
        setSliders(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    const handlePositionWeightChange = (e) => {
        const { name, value } = e.target;
        setPositionWeights(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    const handleDone = () => {
        onComplete({ sliders, positionWeights });
    };

    const handleSkip = () => {
        // Pass null or a special flag to indicate skipping
        onComplete(null);
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>Quick Setup: Build Your Ranking Profile</h2>

            <div className={styles.tabs}>
                {Object.keys(PRESETS).map(preset => (
                    <button
                        key={preset}
                        onClick={() => handlePresetChange(preset)}
                        className={`${styles.tabButton} ${selectedPreset === preset ? styles.activeTab : ''}`}
                    >
                        {PRESETS[preset].label}
                    </button>
                ))}
            </div>

            <div className={styles.slidersSection}>
                <p className={styles.sectionLabel}>Adjust your priorities:</p>
                {Object.entries(sliders).map(([key, val]) => {
                    const safeVal = typeof val === 'number' ? val : 0;
                    return (
                        <div key={key} className={styles.sliderRow}>
                            <label htmlFor={key} className={styles.label}>
                                {SLIDER_LABELS[key]}
                                <span className={styles.tooltipIcon} title={SLIDER_TOOLTIPS[key]}>
                                    i
                                </span>
                            </label>


                            <input
                                id={key}
                                name={key}
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={safeVal}
                                onChange={handleSliderChange}
                                className={styles.slider}
                                style={{
                                    background: `linear-gradient(to right, black ${safeVal * 100}%, white ${safeVal * 100}%)`
                                }}
                            />
                            <div className={styles.value}>{safeVal.toFixed(2)}</div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.slidersSection}>
                <p className={styles.sectionLabel}>Adjust positional weighting:</p>
                {Object.entries(positionWeights).map(([pos, val]) => {
                    const safeVal = typeof val === 'number' ? val : 0;
                    return (
                        <div key={pos} className={styles.sliderRow}>
                            <label htmlFor={pos} className={styles.label}>
                                {pos} Weight
                            </label>
                            <input
                                id={pos}
                                name={pos}
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={safeVal}
                                onChange={handlePositionWeightChange}
                                className={styles.slider}
                                style={{
                                    background: `linear-gradient(to right, black ${safeVal * 100}%, white ${safeVal * 100}%)`
                                }}
                            />
                            <div className={styles.value}>{safeVal.toFixed(2)}</div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.buttonsRow}>
                <button onClick={handleDone} className={styles.submitButton}>
                    Generate Base Rankings
                </button>

                <button
                    onClick={handleSkip}
                    className={styles.skipButton}
                    type="button"
                    aria-label="Skip setup and use existing rankings"
                >
                    Skip Setup
                </button>
            </div>
        </div>
    );
}
