import { useState } from 'react';
import TradeInput from './TradeInput';
import { evaluateTrade } from '../utils/tradeLogic';
import styles from '../styles/Home.module.css';

export default function TradeForm({ allItems }) {
    const [team1Assets, setTeam1Assets] = useState([]);
    const [team2Assets, setTeam2Assets] = useState([]);

    const {
        team1Total,
        team2Total,
        percent1,
        percent2,
        winner,
        reason,
    } = evaluateTrade(team1Assets, team2Assets, { margin: 0.075 });

    const addToTeam = (teamSetter, assets) => item => {
        teamSetter(prev =>
            prev.find(i => i.id === item.id) ? prev : [...prev, item]
        );
    };

    const removeFromTeam = (teamSetter, assets) => id => {
        teamSetter(prev => prev.filter(i => i.id !== id));
    };

    return (
        <div
            className={styles.tradeForm}
            style={{
                backgroundColor: '#f5ecdf', // cream/tan bg
                fontFamily: "'Montserrat Black', sans-serif",
                color: '#333333', // dark text for readability on cream
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 8px rgba(71, 94, 230, 0.15)', // subtle blue shadow
            }}
        >
            <h2
                className={`${styles.sectionTitle} ${styles.team1Title}`}
                style={{
                    fontFamily: "'Playfair Display', serif",
                    color: '#475ee6', // primary blue accent for headings
                    borderBottom: '3px solid #475ee6',
                    paddingBottom: '0.3rem',
                    marginBottom: '1rem',
                }}
            >
                Team 1 (Total Value: {team1Total.toFixed(3)})
            </h2>
            <TradeInput
                allItems={allItems}
                selectedAssets={team1Assets}
                onSelect={addToTeam(setTeam1Assets, team1Assets)}
            />
            <ul
                className={styles.assetList}
                style={{
                    marginTop: '0.75rem',
                    listStyle: 'none',
                    paddingLeft: 0,
                }}
            >
                {team1Assets.map(asset => (
                    <li
                        key={asset.id}
                        className={`${styles.assetItem} ${styles.team1}`}
                        style={{
                            backgroundColor: '#ffffffcc', // white with some transparency
                            marginBottom: '8px',
                            borderRadius: '8px',
                            padding: '10px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '1rem',
                            fontWeight: 900,
                            color: '#222',
                            boxShadow: '0 2px 5px rgba(71, 94, 230, 0.2)', // subtle blue glow
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbe3ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffffcc'}
                    >
                        <span>
                            {(asset.name || asset.label)}{' '}
                            ({asset.position || asset.Pos || asset.Position || asset.type || 'Pick'}, Tier {asset.tier ?? '?'}){' '}
                            - Value: {asset.value?.toFixed(2) || '0.00'}
                        </span>

                        <button
                            onClick={removeFromTeam(setTeam1Assets, team1Assets)(asset.id)}
                            className={`${styles.removeButton} ${styles.team1}`}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#475ee6',
                                fontSize: '1.3rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                padding: 0,
                                marginLeft: '1rem',
                                transition: 'color 0.3s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#2a3abf'}
                            onMouseLeave={e => e.currentTarget.style.color = '#475ee6'}
                            aria-label="Remove asset"
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>

            <h2
                className={`${styles.sectionTitle} ${styles.marginTop} ${styles.team2Title}`}
                style={{
                    fontFamily: "'Playfair Display', serif",
                    color: '#475ee6',
                    borderBottom: '3px solid #475ee6',
                    paddingBottom: '0.3rem',
                    marginTop: '2rem',
                    marginBottom: '1rem',
                }}
            >
                Team 2 (Total Value: {team2Total.toFixed(3)})
            </h2>
            <TradeInput
                allItems={allItems}
                selectedAssets={team2Assets}
                onSelect={addToTeam(setTeam2Assets, team2Assets)}
            />
            <ul
                className={styles.assetList}
                style={{
                    marginTop: '0.75rem',
                    listStyle: 'none',
                    paddingLeft: 0,
                }}
            >
                {team2Assets.map(asset => (
                    <li
                        key={asset.id}
                        className={`${styles.assetItem} ${styles.team2}`}
                        style={{
                            backgroundColor: '#ffffffcc',
                            marginBottom: '8px',
                            borderRadius: '8px',
                            padding: '10px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '1rem',
                            fontWeight: 900,
                            color: '#222',
                            boxShadow: '0 2px 5px rgba(71, 94, 230, 0.2)',
                            transition: 'background-color 0.3s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbe3ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffffcc'}
                    >
                        <span>
                            {(asset.name || asset.label)}{' '}
                            ({asset.position || asset.Pos || asset.Position || asset.type || 'Pick'}, Tier {asset.tier ?? '?'}){' '}
                            - Value: {asset.value?.toFixed(2) || '0.00'}
                        </span>

                        <button
                            onClick={removeFromTeam(setTeam2Assets, team2Assets)(asset.id)}
                            className={`${styles.removeButton} ${styles.team2}`}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#475ee6',
                                fontSize: '1.3rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                padding: 0,
                                marginLeft: '1rem',
                                transition: 'color 0.3s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#2a3abf'}
                            onMouseLeave={e => e.currentTarget.style.color = '#475ee6'}
                            aria-label="Remove asset"
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>

            {(team1Total > 0 || team2Total > 0) && (
                <div
                    className={styles.tradeComparisonContainer}
                    style={{
                        marginTop: '2.5rem',
                        padding: '1rem',
                        backgroundColor: '#dbe3ff',
                        borderRadius: '10px',
                        boxShadow: '0 3px 7px rgba(71, 94, 230, 0.3)',
                        fontWeight: '900',
                        fontFamily: "'Montserrat Black', sans-serif",
                        color: '#222',
                    }}
                >
                    <div
                        className={styles.tradeComparisonBar}
                        style={{
                            display: 'flex',
                            height: '24px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div
                            className={styles.team1Bar}
                            style={{
                                width: `${percent1}%`,
                                backgroundColor: '#475ee6',
                                transition: 'width 0.5s ease',
                            }}
                        />
                        <div
                            className={styles.team2Bar}
                            style={{
                                width: `${percent2}%`,
                                backgroundColor: '#aac3ff',
                                transition: 'width 0.5s ease',
                            }}
                        />
                    </div>
                    <div
                        className={styles.tradeComparisonLabel}
                        style={{ marginTop: '0.6rem', textAlign: 'center', fontSize: '1.1rem' }}
                    >
                        {winner}
                    </div>
                </div>
            )}
            {reason && (
                <div
                    className={styles.tradeComparisonReason}
                    style={{
                        marginTop: '1rem',
                        fontStyle: 'italic',
                        color: '#475ee6',
                        fontWeight: '700',
                        fontFamily: "'Montserrat Black', sans-serif",
                        textAlign: 'center',
                    }}
                >
                    {reason}
                </div>
            )}
        </div>
    );
}
