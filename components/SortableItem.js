/* import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableItem({ player, id, index }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? "#ccc" : index % 2 === 0 ? "#1a1a1a" : "#121212",
        color: "#eee",
        padding: "8px",
        border: "1px solid #444",
        cursor: "grab",
        display: "grid",
        gridTemplateColumns: "50px 2fr 1fr 1fr 1fr", // for Rank, Player, Position, Pos Rank, Value
        alignItems: "center",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div style={{ textAlign: "center" }}>{player.Rank}</div>
            <div>{player.Player}</div>
            <div style={{ textAlign: "center" }}>{player.Position}</div>
            <div style={{ textAlign: "center" }}>{player["Pos Rank"]}</div>
            <div style={{ textAlign: "center" }}>
                {typeof player.VALUE === "number" ? player.VALUE.toFixed(2) : "-"}
            </div>
        </div>
    );
}
*/