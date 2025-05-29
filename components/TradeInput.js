import { useState } from 'react';
import { allItems } from '../data/allItems';

export default function TradeInput({ onSelect }) {
    const [query, setQuery] = useState('');
    const filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                placeholder="Search players or picks..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
            />
            {query && (
                <ul style={{
                    position: 'absolute',
                    zIndex: 10,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    width: '100%',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyle: 'none'
                }}>
                    {filtered.length === 0 && <li style={{ padding: '8px' }}>No matches</li>}
                    {filtered.map(item => (
                        <li
                            key={item.id}
                            onClick={() => {
                                onSelect(item);
                                setQuery('');
                            }}
                            style={{ padding: '8px', cursor: 'pointer' }}
                        >
                            {item.name} ({item.type})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
