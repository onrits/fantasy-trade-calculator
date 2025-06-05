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

const tierColors = {
    1: "#e63946",
    2: "#f4a261",
    3: "#e9c46a",
    4: "#2a9d8f",
    5: "#264653",
    6: "#6c757d",
    7: "#adb5bd",
    8: "#dee2e6",
    9: "#ced4da",
    10: "#495057",
    11: "#8a6d3b",
    12: "#6f42c1",
    13: "#343a40",
};

const tierNames = {
    1: "League Breakers - Tier 1",
    2: "The Elite - Tier 2",
    3: "Franchise Cornerstones - Tier 3",
    4: "Stars - Tier 4",
    5: "High-end Starters - Tier 5",
    6: "Above Average Starters - Tier 6",
    7: "Starters - Tier 7",
    8: "Low-end Starters - Tier 8",
    9: "Fringe Starters - Tier 9",
    10: "Contributors - Tier 10",
    11: "Bench Pieces - Tier 11",
    12: "Insurance - Tier 12",
    13: "Roster Cloggers - Tier 13",
};

function getTierColor(tier) {
    return tierColors[parseInt(tier, 10)] || "#444";
}

function getTierName(tier) {
    return tierNames[parseInt(tier, 10)] || `Tier ${tier}`;
}

// Convert hex color to rgba with opacity
function hexToRGBA(hex, alpha = 1) {
    let r = 0,
        g = 0,
        b = 0;

    if (hex[0] === "#") {
        hex = hex.slice(1);
    }

    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function SortableItem({ player, tier }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: player.id });

    const tierColor = getTierColor(tier);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: "#f5ecdf", // cream background
        color: "#0a0a0a", // dark text
        padding: "8px 20px",
        borderRadius: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: `2px solid ${tierColor}`,
        fontSize: "13px",
        lineHeight: 1.4,
        fontFamily: "'Playfair Display', serif",
        cursor: "grab",
        userSelect: "none",
        boxShadow: isDragging ? `0 0 0 3px ${tierColor}` : "none",
        overflowWrap: "break-word",
        width: "100%",
        boxSizing: "border-box",
    };

    const textStyle = {
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontWeight: 700,
        fontFamily: "'Playfair Display', serif",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        fontSize: "12px",
    };

    const posStyle = {
        color: tierColor,
        marginLeft: 10,
        fontWeight: 600,
        fontFamily: "'Montserrat', sans-serif",
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        fontSize: "11px",
    };

    const valueStyle = {
        fontVariantNumeric: "tabular-nums",
        marginLeft: 14,
        fontWeight: 700,
        color: tierColor,
        minWidth: 56,
        textAlign: "right",
        fontSize: "12px",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div style={textStyle}>
                <strong>{player.Rank}. </strong>
                {player.Player}{" "}
                <span style={posStyle}>({player.Pos || player.Position || "?"})</span>
                <span style={valueStyle}>{player.VALUE.toFixed(2)}</span>
            </div>
        </div>
    );
}

export default function EditableRankings({ players, onChange }) {
    const [tiers, setTiers] = useState({});
    const [activeId, setActiveId] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const tierMap = {};
        players.forEach((p) => {
            const tier = p.TIER || 99;
            if (!tierMap[tier]) tierMap[tier] = [];
            tierMap[tier].push(p);
        });
        for (const tier in tierMap) {
            tierMap[tier].sort((a, b) => a.Rank - b.Rank);
        }
        setTiers(tierMap);
    }, [players]);

    // Detect mobile via window width, update on resize
    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth < 600);
        }
        handleResize(); // initial check
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const findContainer = (id) =>
        Object.keys(tiers).find((tier) =>
            tiers[tier].some((player) => player.id === id)
        );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const sourceTier = findContainer(active.id);
        const destTier = findContainer(over.id);

        if (!sourceTier || !destTier || sourceTier === destTier) return;

        const sourceItems = [...tiers[sourceTier]];
        const destItems = [...tiers[destTier]];

        const activeIndex = sourceItems.findIndex((p) => p.id === active.id);
        const movedPlayer = sourceItems[activeIndex];

        sourceItems.splice(activeIndex, 1);
        destItems.splice(0, 0, { ...movedPlayer, TIER: parseInt(destTier) });

        const updated = {
            ...tiers,
            [sourceTier]: sourceItems,
            [destTier]: destItems,
        };

        setTiers(updated);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const sourceTier = findContainer(active.id);
        const destTier = findContainer(over.id);
        if (!sourceTier || !destTier) return;

        if (sourceTier === destTier) {
            const oldIndex = tiers[sourceTier].findIndex((p) => p.id === active.id);
            const newIndex = tiers[destTier].findIndex((p) => p.id === over.id);

            const reordered = [...tiers[sourceTier]];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);

            // Update moved player's VALUE based on neighbors for smooth ordering
            const updatedMoved = { ...moved };
            if (newIndex === 0) {
                const nextPlayer = reordered[1];
                updatedMoved.VALUE = nextPlayer ? nextPlayer.VALUE : moved.VALUE;
            } else if (newIndex === reordered.length - 1) {
                const prevPlayer = reordered[newIndex - 1];
                updatedMoved.VALUE = prevPlayer ? prevPlayer.VALUE : moved.VALUE;
            } else {
                const prevPlayer = reordered[newIndex - 1];
                const nextPlayer = reordered[newIndex + 1];
                if (prevPlayer && nextPlayer) {
                    updatedMoved.VALUE = (prevPlayer.VALUE + nextPlayer.VALUE) / 2;
                } else {
                    updatedMoved.VALUE = moved.VALUE;
                }
            }
            reordered[newIndex] = updatedMoved;

            const updated = {
                ...tiers,
                [sourceTier]: reordered,
            };

            setTiers(updated);
            onChange(flattenTiers(updated));
        } else {
            const sourceItems = [...tiers[sourceTier]];
            const destItems = [...tiers[destTier]];

            const oldIndex = sourceItems.findIndex((p) => p.id === active.id);
            const movedPlayer = sourceItems[oldIndex];

            // When dragging to a new tier, insert at top (index 0)
            destItems.splice(0, 0, { ...movedPlayer, TIER: parseInt(destTier) });
            sourceItems.splice(oldIndex, 1);

            // Recalculate VALUE for moved player
            const updatedMoved = { ...movedPlayer, TIER: parseInt(destTier) };
            if (destItems.length === 1) {
                updatedMoved.VALUE = movedPlayer.VALUE;
            } else {
                const nextPlayer = destItems[1];
                updatedMoved.VALUE = nextPlayer ? nextPlayer.VALUE : movedPlayer.VALUE;
            }
            destItems[0] = updatedMoved;

            const updated = {
                ...tiers,
                [sourceTier]: sourceItems,
                [destTier]: destItems,
            };

            setTiers(updated);
            onChange(flattenTiers(updated));
        }
    };

    const flattenTiers = (tierMap) => {
        const result = [];
        const sorted = Object.keys(tierMap)
            .map(Number)
            .sort((a, b) => a - b);
        sorted.forEach((tier) => {
            tierMap[tier].forEach((p) => {
                result.push({ ...p, Rank: result.length + 1 });
            });
        });
        return result;
    };

    const activePlayer = activeId
        ? Object.values(tiers)
            .flat()
            .find((p) => p.id === activeId)
        : null;

    // Responsive styles depend on isMobile:
    // Adjust container padding, font sizes, gaps, etc.
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
        marginLeft: "auto",
        marginRight: "auto",
    };

    const tierHeaderStyle = (tierId) => ({
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
        boxSizing: "border-box",
    });

    const tierListStyle = (tierId) => ({
        backgroundColor: hexToRGBA(getTierColor(tierId), 0.1),
        padding: isMobile ? "12px" : "20px",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "8px" : "12px",
        borderLeft: `4px solid ${getTierColor(tierId)}`,
        borderRight: "2px solid #333",
        boxShadow: "none",
        width: "100%",
        boxSizing: "border-box",
    });

    const dragOverlayStyle = {
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
                            <h3 style={tierHeaderStyle(tierId)}>
                                {getTierName(tierId)}
                            </h3>
                            <SortableContext
                                items={tiers[tierId].map((p) => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div style={tierListStyle(tierId)}>
                                    {tiers[tierId].map((player) => (
                                        <SortableItem
                                            key={player.id}
                                            player={player}
                                            tier={tierId}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </div>
                    ))}

                <DragOverlay>
                    {activePlayer ? (
                        <div style={dragOverlayStyle}>
                            {activePlayer.Rank}. {activePlayer.Player} (
                            {activePlayer.Position}) -{" "}
                            {activePlayer.VALUE.toFixed(2)}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
