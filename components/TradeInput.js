import { useState, useRef } from 'react';

export default function TradeInput({ allItems, selectedAssets, onSelect }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    // Filter items not already selected and matching the query (case insensitive)
    const filtered = allItems
        .filter(item => !selectedAssets.find(a => String(a.id) === String(item.id)))
        .filter(item =>
            (item.name || item.full_name || item.label || '')
                .toLowerCase()
                .includes(query.toLowerCase())
        );

    const handleSelect = (item) => {
        onSelect(item);
        setQuery('');
        if (inputRef.current) inputRef.current.focus();
    };

    return (
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
                ref={inputRef}
                type="text"
                placeholder="Search players or picks..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
            />
            {query && filtered.length > 0 && (
                <ul
                    style={{
                        position: 'absolute',
                        top: '38px',
                        left: 0,
                        right: 0,
                        maxHeight: 200,
                        overflowY: 'auto',
                        backgroundColor: '#2c2c2c', // Dark background
                        border: '1px solid #555',   // Dark border
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        zIndex: 10,
                        color: '#eee',              // Light text color
                    }}
                >
                    {filtered.map(item => (
                        <li
                            key={item.id}
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #444', // Dark border between items
                                color: '#eee',                  // Light text color
                            }}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#444')} // Hover effect
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            {item.name || item.full_name || item.label} ({item.type || item.position || ''})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
