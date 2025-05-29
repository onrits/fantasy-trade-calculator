import { useState } from 'react';
import TradeInput from './TradeInput';

export default function TradeForm() {
    const [teamAItems, setTeamAItems] = useState([]);
    const [teamBItems, setTeamBItems] = useState([]);

    const addItemToTeam = (team, item) => {
        if (team === 'A') {
            // Prevent duplicates
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

    return (
        <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Team A */}
            <div>
                <h3>Team A</h3>
                <TradeInput onSelect={item => addItemToTeam('A', item)} />
                <ul>
                    {teamAItems.map(item => (
                        <li key={item.id}>
                            {item.name} ({item.type}){' '}
                            <button onClick={() => removeItemFromTeam('A', item.id)}>Remove</button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Team B */}
            <div>
                <h3>Team B</h3>
                <TradeInput onSelect={item => addItemToTeam('B', item)} />
                <ul>
                    {teamBItems.map(item => (
                        <li key={item.id}>
                            {item.name} ({item.type}){' '}
                            <button onClick={() => removeItemFromTeam('B', item.id)}>Remove</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
