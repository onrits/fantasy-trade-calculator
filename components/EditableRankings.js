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

function SortableItem({ player, tier, onMoveUp, onMoveDown }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: player.id });

    const tierColor = getTierColor(tier);
    const backgroundColor = hexToRGBA(tierColor, 0.4); // 40% opacity

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor,
        color: "#eee",
        padding: "8px 12px",
        borderRadius: "6px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: isDragging
            ? "0 0 0 2px #6366f1"
            : "0 1px 3px rgba(0, 0, 0, 0.6)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "grab",
        userSelect: "none",
    };

    const textStyle = {
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };

    const posStyle = {
        color: "#888",
        marginLeft: 4,
    };

    const valueStyle = {
        fontVariantNumeric: "tabular-nums",
        marginLeft: 8,
        fontWeight: "600",
        color: "#a0a0a0",
        minWidth: 48,
        textAlign: "right",
    };

    const buttonStyle = {
        cursor: "pointer",
        background: "none",
        border: "none",
        color: "#666",
        fontSize: "14px",
        padding: "0 4px",
        lineHeight: "1",
        transition: "color 0.2s ease",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div style={textStyle}>
                <strong>{player.Rank}. </strong>
                {player.Player}{" "}
                <span style={posStyle}>({player.Pos || player.Position || "?"})</span>
                <span style={valueStyle}>{player.VALUE.toFixed(2)}</span>
            </div>
            <div>
                <button
                    onClick={() => onMoveUp(player)}
                    style={buttonStyle}
                    aria-label="Move up"
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6366f1")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                >
                    ▲
                </button>
                <button
                    onClick={() => onMoveDown(player)}
                    style={buttonStyle}
                    aria-label="Move down"
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#6366f1")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                >
                    ▼
                </button>
            </div>
        </div>
    );
}

export default function EditableRankings({ players, onChange }) {
    const [tiers, setTiers] = useState({});
    const [originalPlayers, setOriginalPlayers] = useState([]);
    const [activeId, setActiveId] = useState(null);

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
        setOriginalPlayers(players);
    }, [players]);

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

    const movePlayer = (player, direction) => {
        const tier = findContainer(player.id);
        if (!tier) return;

        const updated = { ...tiers };
        const index = updated[tier].findIndex((p) => p.id === player.id);
        const newIndex = index + direction;

        if (newIndex < 0 || newIndex >= updated[tier].length) return;

        const arr = [...updated[tier]];
        const [moved] = arr.splice(index, 1);
        arr.splice(newIndex, 0, moved);
        updated[tier] = arr;

        setTiers(updated);
        onChange(flattenTiers(updated));
    };

    /* const handleReset = () => {
      const tierMap = {};
      originalPlayers.forEach((p) => {
        const tier = p.TIER || 99;
        if (!tierMap[tier]) tierMap[tier] = [];
        tierMap[tier].push(p);
      });
      for (const tier in tierMap) {
        tierMap[tier].sort((a, b) => a.Rank - b.Rank);
      }
      setTiers(tierMap);
      onChange(originalPlayers);
    }; */

    const activePlayer = activeId
        ? Object.values(tiers)
            .flat()
            .find((p) => p.id === activeId)
        : null;

    return (
        <div
            style={{
                backgroundColor: "#0a0a0a",
                color: "#eee",
                fontFamily:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
                padding: "0.75rem 1rem",
                minHeight: "100vh",
            }}
        >
            {/* <button
        onClick={handleReset}
        style={{
          marginBottom: "1rem",
          padding: "6px 12px",
          borderRadius: "6px",
          backgroundColor: "#1f1f1f",
          color: "#eee",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "13px",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1f1f1f")}
      >
        🔁 Reset
      </button> */}

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
                        <div key={tierId} style={{ marginBottom: "1.5rem" }}>
                            <h3
                                style={{
                                    color: getTierColor(tierId),
                                    marginBottom: "10px",
                                    fontWeight: 800,
                                    fontSize: "1.125rem",
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    userSelect: "none",
                                }}
                            >
                                {getTierName(tierId)}
                            </h3>
                            <SortableContext
                                items={tiers[tierId].map((p) => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div
                                    style={{
                                        backgroundColor: hexToRGBA(getTierColor(tierId), 0.15),
                                        padding: "12px",
                                        borderRadius: "10px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "6px",
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                                        borderLeft: `5px solid ${getTierColor(tierId)}`,
                                        borderRight: "1px solid #222",
                                    }}
                                >
                                    {tiers[tierId].map((player) => (
                                        <SortableItem
                                            key={player.id}
                                            player={player}
                                            tier={tierId}
                                            onMoveUp={(p) => movePlayer(p, -1)}
                                            onMoveDown={(p) => movePlayer(p, 1)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </div>
                    ))}

                <DragOverlay>
                    {activePlayer ? (
                        <div
                            style={{
                                backgroundColor: "#333",
                                color: "#eee",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                                fontWeight: "600",
                                fontSize: "13px",
                                userSelect: "none",
                            }}
                        >
                            {activePlayer.Rank}. {activePlayer.Player} ({activePlayer.Position}) -{" "}
                            {activePlayer.VALUE.toFixed(2)}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
