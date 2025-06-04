import { useState, useRef } from 'react';

export default function TradeInput({ allItems, selectedAssets, onSelect }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

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
        <div style={{ position: 'relative', marginBottom: '1rem', width: '100%' }}>
            <input
                ref={inputRef}
                type="text"
                placeholder="Search players or picks..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #444',
                    backgroundColor: '#1e1e1e',
                    color: '#eee',
                    fontSize: '1rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.7)',
                    outline: 'none',
                    transition: 'border-color 0.25s ease',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#f39c12'}
                onBlur={e => e.currentTarget.style.borderColor = '#444'}
                autoComplete="off"
            />

            {query && filtered.length > 0 && (
                <ul
                    style={{
                        position: 'absolute',
                        top: '44px',
                        left: 0,
                        right: 0,
                        maxHeight: 240,
                        overflowY: 'auto',
                        backgroundColor: '#2c2c2c',
                        borderRadius: '8px',
                        border: '1.5px solid #555',
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        zIndex: 100,
                        boxShadow: '0 8px 16px rgba(0,0,0,0.8)',
                        color: '#eee',
                    }}
                >
                    {filtered.map(item => (
                        <li
                            key={item.id}
                            style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #444',
                                transition: 'background-color 0.2s ease',
                            }}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#444')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <strong>{item.name || item.full_name || item.label}</strong>{' '}
                            <span style={{ color: '#bbb' }}>
                                ({item.Pos || item.Position || item.position || item.type || ''})

                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
