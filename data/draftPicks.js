function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

const generate2025Picks = () => {
    const picks = [];
    const rounds = 4;
    const teamsPerRound = 12;
    for (let round = 1; round <= rounds; round++) {
        for (let pick = 1; pick <= teamsPerRound; pick++) {
            const pickNumber = pick.toString().padStart(2, '0');
            picks.push({
                id: `2025_${round}_${pick}`,
                label: `2025 ${round}${getOrdinal(round)} Rd - ${round}.${pickNumber}`,
            });
        }
    }
    return picks;
};

const futureTiers = [
    'Early',
    'Mid',
    'Late',
];

const generateFuturePicks = (year) => {
    const picks = [];
    const rounds = 4;

    for (let round = 1; round <= rounds; round++) {
        for (const tier of futureTiers) {
            picks.push({
                id: `${year}_${round}_${tier.toLowerCase()}`,
                label: `${year} ${round}${getOrdinal(round)} Rd - ${tier}`,
            });
        }
    }
    return picks;
};

const draftPicks = [
    ...generate2025Picks(),
    ...generateFuturePicks(2026),
    ...generateFuturePicks(2027),
    ...generateFuturePicks(2028),
];

export default draftPicks;
