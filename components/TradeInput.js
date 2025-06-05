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
        <div style={{ position: 'relative', marginBottom: '1.5rem', width: '100%' }}>
            <input
                ref={inputRef}
                type="text"
                placeholder="Search players or picks..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '2px solid #475ee6',
                    backgroundColor: '#f6f3e1',
                    color: '#475ee6',
                    fontSize: '1rem',
                    fontWeight: '700',
                    fontFamily: "'Space Mono', monospace",
                    boxShadow: '4px 4px 0 #111',
                    outline: 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    // Remove default input shadows for clean look
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    appearance: 'none',
                }}
                onFocus={e => {
                    e.currentTarget.style.borderColor = '#ff0055'; // accent pink on focus per baseline hover color
                    e.currentTarget.style.boxShadow = '6px 6px 0 #ff0055';
                }}
                onBlur={e => {
                    e.currentTarget.style.borderColor = '#475ee6';
                    e.currentTarget.style.boxShadow = '4px 4px 0 #111';
                }}
                autoComplete="off"
                spellCheck={false}
            />

            {query && filtered.length > 0 && (
                <ul
                    style={{
                        position: 'absolute',
                        top: '44px',
                        left: 0,
                        right: 0,
                        maxHeight: 250,
                        overflowY: 'auto',
                        backgroundColor: '#f6f3e1',
                        borderRadius: '8px',
                        border: '2px solid #475ee6',
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        zIndex: 150,
                        boxShadow: '6px 6px 0 #111',
                        color: '#475ee6',
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: '700',
                    }}
                >
                    {filtered.map(item => (
                        <li
                            key={item.id}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #ccc',
                                userSelect: 'none',
                                transition: 'background-color 0.25s ease',
                                fontWeight: '700',
                                fontFamily: "'Space Mono', monospace",
                                color: '#475ee6',
                            }}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ff005533')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                            <strong>{item.name || item.full_name || item.label}</strong>{' '}
                            <span style={{ color: '#999', fontWeight: '400', fontFamily: "'Space Mono', monospace" }}>
                                ({item.Pos || item.Position || item.position || item.type || 'N/A'})
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
