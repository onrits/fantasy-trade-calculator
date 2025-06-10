// /components/EasySetup.js
import { useState } from 'react';

const PRESETS = {
    youth: {
        label: "Youth Focused",
        sliders: {
            ageWeight: 0.9,
            productionWeight: 0.3,
            projectedWeight: 0.6,
            valueWeight: 0.5,
        },
        positionWeights: {
            QB: 0.6,
            RB: 0.8,
            WR: 1.0,
            TE: 0.4,
        },
    },
    contender: {
        label: "Contender",
        sliders: {
            ageWeight: 0.3,
            productionWeight: 0.9,
            projectedWeight: 0.9,
            valueWeight: 0.7,
        },
        positionWeights: {
            QB: 0.9,
            RB: 1.0,
            WR: 0.8,
            TE: 0.7,
        },
    },
    balanced: {
        label: "Balanced",
        sliders: {
            ageWeight: 0.5,
            productionWeight: 0.5,
            projectedWeight: 0.5,
            valueWeight: 0.5,
        },
        positionWeights: {
            QB: 0.8,
            RB: 0.8,
            WR: 0.8,
            TE: 0.6,
        },
    },
    riskAverse: {
        label: "Value Daddy",
        sliders: {
            ageWeight: 0.7,
            productionWeight: 0.3,
            projectedWeight: 0.6,
            valueWeight: 0.9,
        },
        positionWeights: {
            QB: 0.9,
            RB: 0.4,
            WR: 0.9,
            TE: 0.3,
        },
    },
    upsideChaser: {
        label: "Upside Chaser",
        sliders: {
            ageWeight: 0.6,
            productionWeight: 0.4,
            projectedWeight: 0.7,
            valueWeight: 0.3,
        },
        positionWeights: {
            QB: 0.5,
            RB: 1.0,
            WR: 0.9,
            TE: 0.2,
        },
    },
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
        setSliders(prev => ({
            ...prev,
            [name]: parseFloat(value)
        }));
    };

    const handlePositionWeightChange = (e) => {
        const { name, value } = e.target;
        setPositionWeights(prev => ({
            ...prev,
            [name]: parseFloat(value)
        }));
    };

    const handleDone = () => {
        onComplete({ sliders, positionWeights });
    };

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h2>Quick Setup Your Rankings</h2>

            <div>
                <p>Select a base profile:</p>
                {Object.keys(PRESETS).map(preset => (
                    <button
                        key={preset}
                        onClick={() => handlePresetChange(preset)}
                        style={{
                            marginRight: '1rem',
                            backgroundColor: selectedPreset === preset ? '#0070f3' : '#333',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {PRESETS[preset].label}
                    </button>
                ))}
            </div>

            <div style={{ marginTop: '1rem' }}>
                <p>Adjust your priorities:</p>
                {Object.entries(sliders).map(([key, val]) => {
                    const safeVal = typeof val === 'number' ? val : 0;
                    return (
                        <div key={key} style={{ marginBottom: '1rem' }}>
                            <label htmlFor={key}>
                                {key.replace('Weight', '')} Weight: {safeVal.toFixed(2)}
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
                                style={{ width: '100%' }}
                            />
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <p>Adjust position weighting:</p>
                {Object.entries(positionWeights).map(([pos, val]) => {
                    const safeVal = typeof val === 'number' ? val : 0;
                    return (
                        <div key={pos} style={{ marginBottom: '1rem' }}>
                            <label htmlFor={pos}>
                                {pos} Weight: {safeVal.toFixed(2)}
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
                                style={{ width: '100%' }}
                            />
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleDone}
                style={{
                    marginTop: '2rem',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                Generate Base Rankings
            </button>
        </div>
    );
}
