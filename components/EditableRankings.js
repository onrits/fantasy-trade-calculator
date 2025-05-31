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

function getTierColor(tier) {
    return tierColors[parseInt(tier, 10)] || "#333";
}

function getTierName(tier) {
    return tierNames[parseInt(tier, 10)] || `Tier ${tier}`;
}

// 🎲 Sortable Player Item
function SortableItem({ player, tier, onMoveUp, onMoveDown }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: player.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? "#444" : "#333",
        color: "#eee",
        padding: "8px",
        marginBottom: "4px",
        border: `2px solid ${getTierColor(tier)}`,
        borderRadius: "4px",
        userSelect: "none",
        minHeight: "40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div>
                {player.Rank}. {player.Player} ({player.Position}) - {player.VALUE}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => onMoveUp(player)} style={{ cursor: "pointer" }}>
                    ⬆️
                </button>
                <button onClick={() => onMoveDown(player)} style={{ cursor: "pointer" }}>
                    ⬇️
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
        setOriginalPlayers(players); // Save original for reset
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

        // Moving within the same tier
        if (sourceTier === destTier) {
            const oldIndex = tiers[sourceTier].findIndex((p) => p.id === active.id);
            const newIndex = tiers[destTier].findIndex((p) => p.id === over.id);

            const reordered = [...tiers[sourceTier]];
            const [moved] = reordered.splice(oldIndex, 1);
            reordered.splice(newIndex, 0, moved);

            // Update VALUE based on position in tier
            const updatedMoved = { ...moved };
            if (newIndex === 0) {
                // Top of tier — value = value of player below (if exists)
                const nextPlayer = reordered[1];
                updatedMoved.VALUE = nextPlayer ? nextPlayer.VALUE : moved.VALUE;
            } else if (newIndex === reordered.length - 1) {
                // Bottom of tier — value = value of player above (if exists)
                const prevPlayer = reordered[newIndex - 1];
                updatedMoved.VALUE = prevPlayer ? prevPlayer.VALUE : moved.VALUE;
            } else {
                // Middle — mean of neighbors
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
            // Moving across tiers — already handled in onDragOver, but update VALUE here
            const sourceItems = [...tiers[sourceTier]];
            const destItems = [...tiers[destTier]];

            const oldIndex = sourceItems.findIndex((p) => p.id === active.id);
            const movedPlayer = sourceItems[oldIndex];

            // The player has already been spliced and inserted at index 0 in onDragOver,
            // but we need to find their index again in destItems
            const newIndex = destItems.findIndex((p) => p.id === active.id);

            if (newIndex === -1) return;

            const updatedMoved = { ...movedPlayer, TIER: parseInt(destTier) };

            if (newIndex === 0) {
                const nextPlayer = destItems[1];
                updatedMoved.VALUE = nextPlayer ? nextPlayer.VALUE : movedPlayer.VALUE;
            } else if (newIndex === destItems.length - 1) {
                const prevPlayer = destItems[newIndex - 1];
                updatedMoved.VALUE = prevPlayer ? prevPlayer.VALUE : movedPlayer.VALUE;
            } else {
                const prevPlayer = destItems[newIndex - 1];
                const nextPlayer = destItems[newIndex + 1];
                if (prevPlayer && nextPlayer) {
                    updatedMoved.VALUE = (prevPlayer.VALUE + nextPlayer.VALUE) / 2;
                } else {
                    updatedMoved.VALUE = movedPlayer.VALUE;
                }
            }

            destItems[newIndex] = updatedMoved;

            sourceItems.splice(oldIndex, 1);

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
        const sorted = Object.keys(tierMap).sort((a, b) => a - b);
        sorted.forEach((tier) => {
            tierMap[tier].forEach((p) => {
                result.push({
                    ...p,
                    Rank: result.length + 1,
                });
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

    const handleReset = () => {
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
    };

    const activePlayer = activeId
        ? Object.values(tiers).flat().find((p) => p.id === activeId)
        : null;

    return (
        <div>
            <button
                onClick={handleReset}
                style={{
                    marginBottom: "1rem",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: "#555",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                }}
            >
                🔁 Reset
            </button>

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
                            <h3 style={{ color: getTierColor(tierId), marginBottom: "0.5rem" }}>
                                {getTierName(tierId)}
                            </h3>
                            <SortableContext
                                items={tiers[tierId].map((p) => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div
                                    style={{
                                        backgroundColor: "#222",
                                        padding: 8,
                                        borderLeft: `5px solid ${getTierColor(tierId)}`,
                                        borderRadius: 4,
                                        minHeight: 50,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
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
                                backgroundColor: "#444",
                                color: "#eee",
                                padding: "8px",
                                border: "1px solid #555",
                                borderRadius: "4px",
                                minHeight: "40px",
                            }}
                        >
                            {activePlayer.Rank}. {activePlayer.Player} ({activePlayer.Position}) -{" "}
                            {activePlayer.VALUE}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
