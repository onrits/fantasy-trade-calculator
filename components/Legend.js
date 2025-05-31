const tierColors = {
    "Tier 1": "#e63946",
    "Tier 2": "#f4a261",
    "Tier 3": "#e9c46a",
    "Tier 4": "#2a9d8f",
    "Tier 5": "#264653",
    "Tier 6": "#6c757d",
    "Tier 7": "#adb5bd",
    "Tier 8": "#dee2e6",
    "Tier 9": "#ced4da",
    "Tier 10+": "#495057",
};

export default function Legend() {
    const tiers = [
        { name: "Tier 1", range: "4.0+", description: "League Breaking. Annual top 3 WAR producer. Positional advantage weekly." },
        { name: "Tier 2", range: "3.25–3.5", description: "The Elite. May fluctuate slightly year to year." },
        { name: "Tier 3", range: "2.25-2.75", description: "High-end Producers. Set and forget starters." },
        { name: "Tier 4", range: "1.75-2.0", description: "Above-average starters. Slight WAR bump if a RB/TE" },
        { name: "Tier 5", range: "1.25-1.5", description: "Strong but not a difference maker. Can be rebuilt in the aggregate." },
        { name: "Tier 6", range: "0.75-1.0", description: "Reliable depth piece. Limited WAR impact." },
        { name: "Tier 7", range: "0.5", description: "Rotational pieces. WAR often neutral." },
        { name: "Tier 8", range: "0.25", description: "Stash or insurance. Negative WAR if regularly started" },
        { name: "Tier 9", range: "0.1", description: "Replacement level. Hopeful spot starter" },
        { name: "Tier 10+", range: "0.05 or less", description: "Waiver wire, irrelevant" },
    ];

    return (
        <div style={{ maxWidth: 400, color: '#eee', backgroundColor: '#222', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Tier Legend</h3>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                {tiers.map(t => (
                    <li key={t.name} style={{ marginBottom: '0.75rem' }}>
                        <strong style={{ color: tierColors[t.name] || '#eee' }}>
                            {t.name}
                        </strong> ({t.range}): {t.description}
                    </li>
                ))}
            </ul>
            <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#333',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontStyle: 'italic',
                color: '#ccc',
                border: '1px solid #555',
            }}>
                <strong>Base First (1.0) Value</strong><br />

                Any pick with equal chance of being pick 1 or 12
            </div>
        </div>
    );
}
