import React, { useEffect, useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Tier color and name maps
const tierColors = {
    1: "#b33a3a",
    2: "#cc7a33",
    3: "#d1b331",
    4: "#3a8a3a",
    5: "#2a71b8",
    6: "#b34a79",
    7: "#5b3db8",
    8: "#0088aa",
    9: "#a02c59",
    10: "#117a65",
    11: "#555c62",
    12: "#6f42c1",
    13: "#343a40",
};

const tierNames = {
    1: "Prometheus - 4+ 1sts - Tier 1",
    2: "Franchise Altering - 3+ 1sts - Tier 2",
    3: "Cornerstones - 2-3 1sts - Tier 3",
    4: "Portfolio Pillars - 2+ 1sts - Tier 4",
    5: "Hopeful Elites - 1-2 1sts - Tier 5",
    6: "Kind of Exciting - 1st+ - Tier 6",
    7: "Solid Pieces - Late 1st - Tier 7",
    8: "Bridge Players - Early 2nd - Tier 8",
    9: "Rentals - Mid 2nd - Tier 9",
    10: "Bench Fodder - Mid 3rd - Tier 10",
    11: "Roster Cloggers - Mid 4th - Tier 11",
    12: "Insurance - Tier 12",
    13: "Cut Plz - Tier 13",
};

const getTierColor = (tier) => tierColors[parseInt(tier, 10)] || "#444";
const getTierName = (tier) => tierNames[parseInt(tier, 10)] || `Tier ${tier}`;

const hexToRGBA = (hex, alpha = 1) => {
    let r = 0, g = 0, b = 0;
    hex = hex.replace("#", "");
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function SortableItem({ player, tier }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });
    const tierColor = getTierColor(tier);

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                backgroundColor: "#f5ecdf",
                color: "#0a0a0a",
                padding: "8px 20px",
                borderRadius: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `2px solid ${tierColor}`,
                fontSize: "13px",
                fontFamily: "'Playfair Display', serif",
                cursor: "grab",
                userSelect: "none",
                boxShadow: isDragging ? `0 0 0 3px ${tierColor}` : "none",
                width: "100%",
                boxSizing: "border-box",
            }}
            {...attributes}
            {...listeners}
        >
            <div
                style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                    fontFamily: "'Playfair Display', serif",
                    textTransform: "uppercase",
                    fontSize: "12px",
                }}
            >
                <strong>{player.Rank}. </strong>
                {player.Player}
                <span
                    style={{
                        color: tierColor,
                        marginLeft: 10,
                        fontWeight: 600,
                        fontFamily: "'Montserrat', sans-serif",
                        textTransform: "uppercase",
                        fontSize: "11px",
                    }}
                >
                    ({player.Pos || player.Position || "?"})
                </span>
                <span
                    style={{
                        marginLeft: 14,
                        fontWeight: 700,
                        color: tierColor,
                        minWidth: 56,
                        textAlign: "right",
                        fontSize: "12px",
                    }}
                >
                    {player.value.toFixed(2)}
                </span>
            </div>
        </div>
    );
}

export default function EditableRankings({ players, onChange }) {
    const [tiers, setTiers] = useState({});
    const [activeId, setActiveId] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!players || players.length === 0) return;
        const normalized = players.map(p => ({
            ...p,
            id: p.id || p.name || `${p.Player}-${p.Pos || p.position || "??"}`,
            tier: p.tier ?? p.tier ?? 99,
            value: p.value ?? p.value ?? 0,
            Rank: p.Rank ?? p.rank ?? 99,
        }));

        normalized.sort((a, b) => a.Rank - b.Rank);
        const grouped = {};
        normalized.forEach(p => {
            const t = p.tier;
            if (!grouped[t]) grouped[t] = [];
            grouped[t].push(p);
        });
        setTiers(grouped);
    }, [players]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 600);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const findTier = (id) =>
        Object.keys(tiers).find((tier) =>
            tiers[tier].some((player) => player.id === id)
        );

    const handleDragStart = ({ active }) => setActiveId(active.id);

    const handleDragOver = ({ active, over }) => {
        if (!over) return;
        const from = findTier(active.id);
        const to = findTier(over.id);
        if (!from || !to || from === to) return;

        const source = [...tiers[from]];
        const dest = [...tiers[to]];
        const idx = source.findIndex(p => p.id === active.id);
        const moved = source[idx];

        source.splice(idx, 1);
        dest.unshift({ ...moved, tier: parseInt(to) });

        setTiers({
            ...tiers,
            [from]: source,
            [to]: dest,
        });
    };

    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over) return;

        const from = findTier(active.id);
        const to = findTier(over.id);
        if (!from || !to) return;

        if (from === to) {
            const reordered = [...tiers[from]];
            const oldIdx = reordered.findIndex(p => p.id === active.id);
            const newIdx = reordered.findIndex(p => p.id === over.id);
            const [moved] = reordered.splice(oldIdx, 1);

            let newValue = moved.value;
            if (newIdx === 0) {
                newValue = reordered[0]?.value ?? moved.value;
            } else if (newIdx === reordered.length) {
                newValue = reordered[newIdx - 1]?.value ?? moved.value;
            } else {
                const before = reordered[newIdx - 1];
                const after = reordered[newIdx];
                newValue = before && after ? (before.value + after.value) / 2 : moved.value;
            }

            reordered.splice(newIdx, 0, { ...moved, value: newValue });

            const updated = { ...tiers, [from]: reordered };
            setTiers(updated);
            onChange(flattenTiers(updated));
        } else {
            const src = [...tiers[from]];
            const dst = [...tiers[to]];
            const idx = src.findIndex(p => p.id === active.id);
            const moved = src[idx];

            src.splice(idx, 1);
            dst.unshift({ ...moved, tier: parseInt(to), value: dst[1]?.value ?? moved.value });

            const updated = { ...tiers, [from]: src, [to]: dst };
            setTiers(updated);
            onChange(flattenTiers(updated));
        }
    };

    const flattenTiers = (tierMap) => {
        const result = [];
        Object.keys(tierMap).sort((a, b) => a - b).forEach(tier => {
            tierMap[tier].forEach((p) =>
                result.push({ ...p, Rank: result.length + 1 })
            );
        });
        return result;
    };

    const activePlayer = activeId
        ? Object.values(tiers).flat().find(p => p.id === activeId)
        : null;

    const containerStyle = {
        backgroundColor: "#f5ecdf",
        color: "#2e2e2e",
        fontFamily: "'Montserrat Black', 'Montserrat', sans-serif",
        padding: isMobile ? "0.75rem 1rem" : "1rem 1.5rem",
        minHeight: "100vh",
    };

    const tierWrapperStyle = {
        marginBottom: "2rem",
        maxWidth: isMobile ? "100%" : "720px",
        margin: "0 auto",
    };

    return (
        <div style={containerStyle}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {Object.keys(tiers)
                    .sort((a, b) => a - b)
                    .map((tierId) => (
                        <div key={tierId} style={tierWrapperStyle}>
                            <h3 style={{
                                color: getTierColor(tierId),
                                marginBottom: isMobile ? "0.75rem" : "1rem",
                                fontWeight: 900,
                                fontSize: isMobile ? "0.9rem" : "1rem",
                                fontFamily: "'Playfair Display', serif",
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                userSelect: "none",
                                borderBottom: `2px solid ${getTierColor(tierId)}`,
                                paddingBottom: "6px",
                                width: "100%",
                            }}>
                                {getTierName(tierId)}
                            </h3>
                            <SortableContext
                                items={tiers[tierId]?.map((p) => p.id) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                <div style={{
                                    backgroundColor: hexToRGBA(getTierColor(tierId), 0.1),
                                    padding: isMobile ? "12px" : "20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: isMobile ? "8px" : "12px",
                                    borderLeft: `4px solid ${getTierColor(tierId)}`,
                                    borderRight: "2px solid #333",
                                    boxSizing: "border-box",
                                }}>
                                    {tiers[tierId]?.map((player) => (
                                        <SortableItem key={player.id} player={player} tier={tierId} />
                                    ))}
                                </div>
                            </SortableContext>
                        </div>
                    ))}
                <DragOverlay>
                    {activePlayer ? (
                        <div style={{
                            backgroundColor: "#475ee6",
                            color: "#f5ecdf",
                            padding: isMobile ? "8px 12px" : "12px 18px",
                            borderRadius: "10px",
                            boxShadow: "0 6px 14px rgba(71, 94, 230, 0.3)",
                            fontWeight: "900",
                            fontSize: isMobile ? "12px" : "14px",
                            userSelect: "none",
                            fontFamily: "'Montserrat Black', 'Montserrat', sans-serif",
                            whiteSpace: "nowrap",
                        }}>
                            {activePlayer.Rank}. {activePlayer.Player} ({activePlayer.Position || activePlayer.Pos || "?"}) - {activePlayer.value.toFixed(2)}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
