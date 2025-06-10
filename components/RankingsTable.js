import React from "react";

const tierColors = {
    1: "#e63946",   // League Breakers (red)
    2: "#f4a261",   // The Elite (orange)
    3: "#e9c46a",   // Franchise Cornerstones (yellow)
    4: "#2a9d8f",   // Stars (teal)
    5: "#264653",   // High-end Starters (dark blue)
    6: "#6c757d",   // Above Average Starters (gray)
    7: "#adb5bd",   // Starters (light gray)
    8: "#dee2e6",   // Low-end Starters (lighter gray)
    9: "#ced4da",   // Fringe Starters (even lighter gray)
    10: "#495057",  // Contributors (dark slate)
    11: "#8a6d3b",  // Bench Pieces (brownish)
    12: "#6f42c1",  // Insurance (purple)
    13: "#343a40",  // Roster Cloggers (dark gray)
};

const tierNames = {
    1: "League Breakers",
    2: "The Elite",
    3: "Franchise Cornerstones",
    4: "Stars",
    5: "High-end Starters",
    6: "Above Average Starters",
    7: "Starters",
    8: "Low-end Starters",
    9: "Fringe Starters",
    10: "Contributors",
    11: "Bench Pieces",
    12: "Insurance",
    13: "Roster Cloggers",
};

export default function RankingsTable({ rankings }) {
    if (!rankings || !rankings.length) return <p>No rankings data found</p>;

    const sortedRankings = [...rankings].sort((a, b) => a.Rank - b.Rank);

    let lastTier = null;

    return (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
            <thead>
                <tr style={{ backgroundColor: "#222", color: "#eee" }}>
                    <th style={{ padding: "8px", border: "1px solid #444" }}>Rank</th>
                    <th style={{ padding: "8px", border: "1px solid #444" }}>Name</th>
                    <th style={{ padding: "8px", border: "1px solid #444" }}>Position</th>
                    <th style={{ padding: "8px", border: "1px solid #444" }}>Value</th>
                    <th style={{ padding: "8px", border: "1px solid #444" }}>Tier</th>
                </tr>
            </thead>
            <tbody>
                {sortedRankings.map((player, i) => {
                    const showTierHeader = player.tier !== lastTier;
                    lastTier = player.tier;

                    return (
                        <React.Fragment key={player.id || i}>
                            {showTierHeader && (
                                <tr
                                    style={{
                                        backgroundColor: tierColors[player.tier] || "#444",
                                        color: "#fff",
                                        fontWeight: "bold",
                                        textAlign: "center",
                                    }}
                                >
                                    <td colSpan={5} style={{ padding: "8px", border: "1px solid #444" }}>
                                        {tierNames[player.tier] || `Tier ${player.tier}`}
                                    </td>
                                </tr>
                            )}
                            <tr
                                style={{
                                    backgroundColor: i % 2 === 0 ? "#1a1a1a" : "#121212",
                                    color: "#eee",
                                }}
                            >
                                <td style={{ padding: "8px", border: "1px solid #444", textAlign: "center" }}>
                                    {player.Rank}
                                </td>
                                <td style={{ padding: "8px", border: "1px solid #444" }}>{player.Player}</td>
                                <td style={{ padding: "8px", border: "1px solid #444", textAlign: "center" }}>
                                    {player.Position}
                                </td>
                                <td style={{ padding: "8px", border: "1px solid #444", textAlign: "center" }}>
                                    {typeof player.value === "number" ? player.value.toFixed(3) : "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "8px",
                                        border: "1px solid #444",
                                        textAlign: "center",
                                        color: tierColors[player.tier] || "#eee",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {player.tier}
                                </td>
                            </tr>
                        </React.Fragment>
                    );
                })}
            </tbody>
        </table>
    );
}

