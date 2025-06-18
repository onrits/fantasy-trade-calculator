function parseTier(tier) {
    if (typeof tier === 'number') return tier;
    const match = typeof tier === 'string' && tier.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

function getTierForAsset(asset) {
    return parseTier(asset.tier || asset.tier || null);
}

export function evaluateTrade(team1Assets, team2Assets, options = {}) {
    const margin = options.margin || 0.075;
    const penaltyPerSpot = options.rosterPenaltyRate || 0.05;

    const totalValue = (assets) =>
        assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

    const rawTeam1Total = totalValue(team1Assets);
    const rawTeam2Total = totalValue(team2Assets);

    let team1Total = rawTeam1Total;
    let team2Total = rawTeam2Total;

    let reasons = [];
    const team1Count = team1Assets.length;
    const team2Count = team2Assets.length;
    const diff = Math.abs(team1Count - team2Count);

    // 🧩 Roster Spot Value Adjustment helper
    const CURRENT_YEAR = new Date().getFullYear();
    const isActiveRosterAsset = item => {
        if (item.type !== 'Pick') return true;
        if (!item.label || typeof item.label !== 'string') return false;
        const pickYear = parseInt(item.label.split(' ')[0]);
        return pickYear === CURRENT_YEAR;
    };

    const team1Players = team1Assets.filter(isActiveRosterAsset);
    const team2Players = team2Assets.filter(isActiveRosterAsset);
    const team1PlayerCount = team1Players.length;
    const team2PlayerCount = team2Players.length;

    // 📦 Quantity-for-quality / Roster Clogger Adjustment (3+ extra *players*)
    const playerDiff = Math.abs(team1PlayerCount - team2PlayerCount);
    if (playerDiff >= 3) {
        reasons.push('One side is trading 3+ more players — potential roster clogger');
        const cloggerPenalty = 0.1;
        const adjustmentFactor = 1 - cloggerPenalty * (playerDiff - 2);
        if (team1PlayerCount > team2PlayerCount) {
            team1Total *= adjustmentFactor;
            reasons.push(`Adjusted Team 1's value by (-${Math.round((1 - adjustmentFactor) * 100)}%).`);
        } else {
            team2Total *= adjustmentFactor;
            reasons.push(`Adjusted Team 2's value by (-${Math.round((1 - adjustmentFactor) * 100)}%).`);
        }
    }

    // 🧩 Roster Spot Value Adjustment
    if (team1PlayerCount !== team2PlayerCount) {
        const extraPlayers = Math.abs(team1PlayerCount - team2PlayerCount);
        const penalty = 1 - penaltyPerSpot * extraPlayers;
        const percent = Math.round(penaltyPerSpot * extraPlayers * 100);
        if (team1PlayerCount > team2PlayerCount) {
            team1Total *= penalty;
            reasons.push(`Team 1 is receiving ${extraPlayers} more players — Roster spot value adjustment: (-${percent}%).`);
        } else {
            team2Total *= penalty;
            reasons.push(`Team 2 is receiving ${extraPlayers} more players — Roster spot value adjustment: (-${percent}%).`);
        }
    }


    // 🏈 QB Tax Adjustment
    function hasValuableQB(assets) {
        return assets.some(a => (a.Pos === 'QB' || a.type === 'QB') && (a.value || 0) >= 1.5);
    }

    function hasQB(assets) {
        return assets.some(a => a.Pos === 'QB' || a.type === 'QB');
    }

    const qbTaxRate = 0.075;
    const team1HasValuableQB = hasValuableQB(team1Assets);
    const team2HasValuableQB = hasValuableQB(team2Assets);
    const team1HasQB = hasQB(team1Assets);
    const team2HasQB = hasQB(team2Assets);

    if (team1HasValuableQB && !team2HasQB) {
        team2Total *= 1 - qbTaxRate;
        reasons.push(`Team 2 receives a valuable QB without trading one — Team 2 Adjustment: (-${Math.round(qbTaxRate * 100)}%).`);
    }
    if (team2HasValuableQB && !team1HasQB) {
        team1Total *= 1 - qbTaxRate;
        reasons.push(`Team 1 receives a valuable QB without trading one — Team 1 Adjustment: (-${Math.round(qbTaxRate * 100)}%).`);
    }

    // ⭐ Tier Mismatch / Star Tax Adjustment
    const top1 = team1Assets.map(getTierForAsset).filter(t => t !== null).sort((a, b) => a - b)[0];
    const top2 = team2Assets.map(getTierForAsset).filter(t => t !== null).sort((a, b) => a - b)[0];

    if (top1 !== undefined && top2 !== undefined) {
        const tierGap = Math.abs(top1 - top2);

        // Lower max allowed gap for top 3 tiers
        const maxAllowedGap = (top1 <= 3 || top2 <= 3) ? 1 : 2;

        if (tierGap > maxAllowedGap) {
            let taxRate = 0.1 * (tierGap - maxAllowedGap);

            // Extra multiplier if either is tier 1 star
            const starMultiplier = (top1 === 1 || top2 === 1) ? 1.5 : 1;
            taxRate *= starMultiplier;

            reasons.push(`Tier Mismatch: Top asset gap is ${tierGap} tiers - Must be within ${maxAllowedGap} tiers to avoid tax [10% per tier over]${starMultiplier > 1 ? ' + 50% for tier 1 star' : ''} -`);

            if (top1 < top2) {
                team2Total *= 1 - taxRate;
                reasons.push(`Team 2 Adjustment: (-${Math.round(taxRate * 100)}%).`);
            } else {
                team1Total *= 1 - taxRate;
                reasons.push(`Team 1 Adjustment: (-${Math.round(taxRate * 100)}%).`);
            }
        }
    }



    // Even trade detection
    const allTiers = [...team1Assets, ...team2Assets].map(getTierForAsset).filter(t => t !== null);
    let winner = '';
    let isEvenTrade = false;

    if (allTiers.length > 0) {
        const minTier = Math.min(...allTiers);
        const maxTier = Math.max(...allTiers);
        const sameTier = maxTier - minTier === 0;
        const sameCount = team1Count === team2Count;

        if (sameTier && sameCount) {
            winner = 'Even Trade';
            isEvenTrade = true;
            reasons.push('All assets are from the same tier and equal in number — differences are a matter of preference.');
        }
    }

    if (!isEvenTrade) {
        const totalCombined = team1Total + team2Total;
        const percent1 = totalCombined === 0 ? 50 : (team1Total / totalCombined) * 100;

        if (team1Count === 0 && team2Count === 0) {
            winner = '';
        } else if (Math.abs(team1Total - team2Total) / Math.max(team1Total, team2Total) <= margin) {
            winner = 'Even Trade';
            isEvenTrade = true;
        } else if (team1Total > team2Total) {
            winner = 'Team 1 Wins';
        } else {
            winner = 'Team 2 Wins';
        }
    }

    const totalCombined = team1Total + team2Total;
    const percent1 = totalCombined === 0 ? 50 : (team1Total / totalCombined) * 100;
    const percent2 = 100 - percent1;

    return {
        rawTeam1Total: parseFloat(rawTeam1Total.toFixed(3)),
        rawTeam2Total: parseFloat(rawTeam2Total.toFixed(3)),
        adjustedTeam1Total: parseFloat(team1Total.toFixed(3)),
        adjustedTeam2Total: parseFloat(team2Total.toFixed(3)),
        percent1: parseFloat(percent1.toFixed(2)),
        percent2: parseFloat(percent2.toFixed(2)),
        winner,
        isEvenTrade,
        reason: reasons.join(' ').trim(),
        reasonList: reasons
    };
}