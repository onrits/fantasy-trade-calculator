function parseTier(tier) {
    if (typeof tier === 'number') return tier;
    const match = typeof tier === 'string' && tier.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

export function evaluateTrade(team1Assets, team2Assets, options = {}) {
    const margin = options.margin || 0.075;

    const totalValue = (assets) =>
        assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

    const rawTeam1Total = totalValue(team1Assets);
    const rawTeam2Total = totalValue(team2Assets);

    let team1Total = rawTeam1Total;
    let team2Total = rawTeam2Total;

    let reason = '';
    const team1Count = team1Assets.length;
    const team2Count = team2Assets.length;
    const diff = Math.abs(team1Count - team2Count);

    // 📦 Quantity-for-quality / Roster Clogger Adjustment
    if (diff >= 3) {
        reason += '📦 One side is trading 3+ more pieces — potential roster clogger. ';
        const penaltyPerExtra = 0.1; // 10% per extra piece
        const adjustmentFactor = 1 - penaltyPerExtra * (diff - 2); // Start penalty at 3rd piece
        if (team1Count > team2Count) {
            team1Total *= adjustmentFactor;
            reason += `Adjusted Team 1's value by -${Math.round((1 - adjustmentFactor) * 100)}%. `;
        } else {
            team2Total *= adjustmentFactor;
            reason += `Adjusted Team 2's value by -${Math.round((1 - adjustmentFactor) * 100)}%. `;
        }
    }

    // ⭐ Tier Mismatch / Star Tax Adjustment
    const top1 = team1Assets
        .map((a) => parseTier(a.tier))
        .filter((t) => t !== null)
        .sort((a, b) => a - b)[0];

    const top2 = team2Assets
        .map((a) => parseTier(a.tier))
        .filter((t) => t !== null)
        .sort((a, b) => a - b)[0];

    if (top1 !== undefined && top2 !== undefined) {
        const tierGap = Math.abs(top1 - top2);
        if (tierGap > 2) {
            const taxRate = 0.1 * (tierGap - 2); // 10% per tier beyond 2
            reason += `⚠️ Tier mismatch: Top asset gap is ${tierGap} tiers — applying ${Math.round(taxRate * 100)}% Star Tax. `;
            if (top1 < top2) {
                team2Total *= 1 - taxRate;
                reason += `Team 2 value adjusted by -${Math.round(taxRate * 100)}%. `;
            } else {
                team1Total *= 1 - taxRate;
                reason += `Team 1 value adjusted by -${Math.round(taxRate * 100)}%. `;
            }
        }
    }

    // NEW: Check if all traded assets are within the same tier
    const allTiers = [
        ...team1Assets.map((a) => parseTier(a.tier)).filter((t) => t !== null),
        ...team2Assets.map((a) => parseTier(a.tier)).filter((t) => t !== null),
    ];

    let winner = '';
    let isEvenTrade = false;

    const totalCombined = team1Total + team2Total;
    let percent1 = totalCombined === 0 ? 50 : (team1Total / totalCombined) * 100;
    let percent2 = 100 - percent1;

    const noPlayers = team1Assets.length === 0 && team2Assets.length === 0;

    if (noPlayers) {
        winner = 'Add players to evaluate';
    } else {
        const minTier = Math.min(...allTiers);
        const maxTier = Math.max(...allTiers);
        const sameTier = maxTier - minTier === 0;
        const sameCount = team1Count === team2Count;

        if (sameTier && sameCount) {
            winner = 'Even Trade';
            isEvenTrade = true;
            reason += 'ℹ️ All traded assets are from the same tier and equal in number — differences are a matter of team preference. ';
        } else if (Math.abs(team1Total - team2Total) / Math.max(team1Total, team2Total) <= margin) {
            winner = 'Even Trade';
            isEvenTrade = true;
        } else if (team1Total > team2Total) {
            winner = 'Team 1 Wins';
        } else {
            winner = 'Team 2 Wins';
        }
    }

    return {
        rawTeam1Total: parseFloat(rawTeam1Total.toFixed(3)),
        rawTeam2Total: parseFloat(rawTeam2Total.toFixed(3)),
        adjustedTeam1Total: parseFloat(team1Total.toFixed(3)),
        adjustedTeam2Total: parseFloat(team2Total.toFixed(3)),
        percent1: parseFloat(percent1.toFixed(2)),
        percent2: parseFloat(percent2.toFixed(2)),
        winner,
        isEvenTrade,
        reason: reason.trim(),
    };
}
