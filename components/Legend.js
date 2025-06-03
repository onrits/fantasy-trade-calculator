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
    "Tier 11": "#343a40",
};

export default function Legend() {
    const tiers = [
        {
            name: "Tier 1",
            war: "6.0+",
            frp: "4.41+",
            ranks: "QB: 1–2",
            description: "League Breaking. Untouchables. Typically just Konami Code QBs.",
        },
        {
            name: "Tier 2",
            war: "5.0–6.0",
            frp: "3.33–4.0",
            ranks: "QB: 3–4, WR: 1–3",
            description: "True elites. Alpha WRs, elite producers at premium positions. Rarely available. Franchise-defining.",
        },
        {
            name: "Tier 3",
            war: "4.0–4.99",
            frp: "2.67–3.33",
            ranks: "QB: 5–8, WR: 4–8, RB: 1–5, TE: 1–2",
            description: "Cornerstones. Rising stars, peak veterans, or elite positional scorers (RB/TE1). Core pieces.",
        },
        {
            name: "Tier 4",
            war: "3.25–3.99",
            frp: "2.17–2.66",
            ranks: "QB: 9–12, WR: 9–15, RB: 6–11, TE: 3",
            description: "Strong starters. Reliable weekly contributors, valuable depth.",
        },
        {
            name: "Tier 5",
            war: "2.5–3.24",
            frp: "1.67–2.16",
            ranks: "QB: 13–17, WR: 16–20, RB: 12–16, TE: 4–5",
            description: "Solid producers. Aging studs or breakout candidates, not true alphas.",
        },
        {
            name: "Tier 6",
            war: "2.0–2.49",
            frp: "1.33–1.66",
            ranks: "QB: 18–21, WR: 21–24, RB: 17–22, TE: 6–7",
            description: "Serviceable starters. Startable but replaceable, often in flux.",
        },
        {
            name: "Tier 7",
            war: "1.5–1.99",
            frp: "1.0–1.33",
            ranks: "QB: 22–24, WR: 25–32, RB: 23–29, TE: 8–10",
            description: "Fringe starters. Depth with upside, volatile usage or production.",
        },
        {
            name: "Tier 8",
            war: "1.0–1.49",
            frp: "0.67–0.99",
            ranks: "WR: 33–40, RB: 30–36, TE: 11–13",
            description: "Insurance plays. Startable in a pinch, ideally bench or stash.",
        },
        {
            name: "Tier 9",
            war: "0.5–0.99",
            frp: "0.33–0.66",
            ranks: "WR: 41–50, RB: 37–44, TE: 14–16",
            description: "Bench fillers. Some hope or past glory. Not trustworthy yet.",
        },
        {
            name: "Tier 10+",
            war: "0.0–0.49",
            frp: "0–0.32",
            ranks: "WR: 51–60, RB: 45–52, TE: 17–20",
            description: "Waiver-level players. You’re stashing or praying.",
        },
        {
            name: "Tier 11",
            war: "<0",
            frp: "<0",
            ranks: "WR: 61+, RB: 53+, TE: 21+",
            description: "Below replacement. Roster Cloggers. Bonus for moving them for any value.",
        },
    ];

    return (
        <div
            style={{
                maxWidth: 500,
                color: "#eee",
                backgroundColor: "#222",
                padding: "1.5rem",
                borderRadius: "8px",
                fontFamily: "sans-serif",
            }}
        >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Tier Legend</h3>
            <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {tiers.map((t) => (
                    <li key={t.name} style={{ marginBottom: "1.5rem" }}>
                        <div style={{ color: tierColors[t.name] || "#eee", fontWeight: "bold", fontSize: "1.05rem" }}>
                            {t.name}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#ccc" }}>
                            WAR: <strong style={{ color: "#fff" }}>{t.war}</strong> / FRPs:{" "}
                            <strong style={{ color: "#fff" }}>{t.frp}</strong>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#bbb" }}>{t.ranks}</div>
                        <div style={{ fontSize: "0.85rem", color: "#aaa", marginTop: "4px" }}>{t.description}</div>
                    </li>
                ))}
            </ul>
            <div
                style={{
                    marginTop: "1rem",
                    padding: "0.75rem",
                    backgroundColor: "#333",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontStyle: "italic",
                    color: "#ccc",
                    border: "1px solid #555",
                }}
            >
                <strong>Base First (1.0)</strong>
                <br />
                Generic first-round pick, equally likely to be pick 1 or 12. <br />
                Worth ~1.25–1.75 WAR per season or ~0.05 WAR per game.
            </div>
            <br /><p style={{ marginBottom: "1.5rem" }}>
                WAR = average Wins Above Replacement over 3 year window<br />
                FRPs = equivalent value in Base First Round Picks <br />
                Historical positional finishing ranks in each tier
            </p>
        </div>
    );
}
