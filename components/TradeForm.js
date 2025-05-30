import { useState } from 'react';
import TradeInput from './TradeInput';
import playerValues from '../data/playerValues.json'; // your static players with values
import draftPicks from '../data/draftPickValues.json';    // your static picks with values

export default function TradeForm() {
    const [teamAItems, setTeamAItems] = useState([]);
    const [teamBItems, setTeamBItems] = useState([]);

    // Combine players and picks into one list
    const allItems = [
        ...playerValues.map(p => ({
            id: p.Player,
            name: p.Player,
            position: p.Position,
            value: p.VALUE,
            type: 'Player',
        })),
        ...draftPicks.map(p => ({
            id: p.id.toString(),
            name: p.label,
            value: p.VALUE,
            type: 'Pick',
        })),
    ];

    // Add item to team if not already selected
    const addItemToTeam = (team, item) => {
        if (team === 'A') {
            if (!teamAItems.find(i => i.id === item.id)) {
                setTeamAItems([...teamAItems, item]);
            }
        } else {
            if (!teamBItems.find(i => i.id === item.id)) {
                setTeamBItems([...teamBItems, item]);
            }
        }
    };

    const removeItemFromTeam = (team, itemId) => {
        if (team === 'A') {
            setTeamAItems(teamAItems.filter(i => i.id !== itemId));
        } else {
            setTeamBItems(teamBItems.filter(i => i.id !== itemId));
        }
    };

    // Calculate total value for a team
    const calcTotalValue = items =>
        items.reduce((sum, item) => sum + (item.value || 0), 0);

    return (
        <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Team A */}
            <div>
                <h3>Team A</h3>
                <TradeInput
                    allItems={allItems}
                    selectedAssets={teamAItems}
                    onSelect={item => addItemToTeam('A', item)}
                />
                <ul>
                    {teamAItems.map(item => (
                        <li key={item.id}>
                            {item.name} ({item.type}) — Value: {item.value.toFixed(2)}{' '}
                            <button onClick={() => removeItemFromTeam('A', item.id)}>
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
                <p>
                    <strong>Total value:</strong> {calcTotalValue(teamAItems).toFixed(2)}
                </p>
            </div>

            {/* Team B */}
            <div>
                <h3>Team B</h3>
                <TradeInput
                    allItems={allItems}
                    selectedAssets={teamBItems}
                    onSelect={item => addItemToTeam('B', item)}
                />
                <ul>
                    {teamBItems.map(item => (
                        <li key={item.id}>
                            {item.name} ({item.type}) — Value: {item.value.toFixed(2)}{' '}
                            <button onClick={() => removeItemFromTeam('B', item.id)}>
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
                <p>
                    <strong>Total value:</strong> {calcTotalValue(teamBItems).toFixed(2)}
                </p>
            </div>
        </div>
    );
}
