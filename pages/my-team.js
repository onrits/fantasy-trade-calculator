import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import playerValues from '../data/playerValues.json';
import styles from '../styles/myTeam.module.css';

export default function MyTeamPage() {
    const { user } = useAuth();

    const [sleeperUsername, setSleeperUsername] = useState('');
    const [leagues, setLeagues] = useState([]);
    const [selectedLeague, setSelectedLeague] = useState('');
    const [roster, setRoster] = useState([]);
    const [userPlayers, setUserPlayers] = useState([]);
    const [setupDone, setSetupDone] = useState(false);

    const [loadingLeagues, setLoadingLeagues] = useState(false);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [sleeperPlayers, setSleeperPlayers] = useState({});

    const [sortKey, setSortKey] = useState('marketValue');
    const [sortAsc, setSortAsc] = useState(false);

    const playerMap = playerValues.reduce((acc, player) => {
        acc[player.Player] = player;
        return acc;
    }, {});

    // Restore saved state
    useEffect(() => {
        const storedUsername = localStorage.getItem('sleeperUsername');
        const storedLeague = localStorage.getItem('selectedLeague');
        const storedRoster = localStorage.getItem('savedRoster');

        if (storedUsername) setSleeperUsername(storedUsername);
        if (storedLeague) setSelectedLeague(storedLeague);
        if (storedRoster) {
            try {
                const parsedRoster = JSON.parse(storedRoster);
                if (Array.isArray(parsedRoster)) {
                    setRoster(parsedRoster);
                }
            } catch (e) {
                console.error('Error parsing saved roster:', e);
            }
        }
    }, []);

    useEffect(() => {
        if (user && !setupDone) {
            const loadUserRankings = async () => {
                try {
                    const docRef = doc(db, 'userRankings', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const loadedPlayers = docSnap.data().players;
                        const normalizedPlayers = loadedPlayers.map((p, idx) => ({
                            ...p,
                            tier: p.tier ?? 11,
                            value: p.value ?? 0,
                            Rank: idx + 1,
                        }));
                        setUserPlayers(normalizedPlayers);
                        setSetupDone(true);
                    }
                } catch (error) {
                    console.error('Error loading user rankings:', error);
                }
            };

            loadUserRankings();
        }
    }, [user, setupDone]);

    const loadLeagues = async () => {
        if (!sleeperUsername) return;

        setLoadingLeagues(true);
        try {
            const userRes = await fetch(`https://api.sleeper.app/v1/user/${sleeperUsername}`);
            const userData = await userRes.json();

            const leaguesRes = await fetch(
                `https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/2025`
            );
            const leaguesData = await leaguesRes.json();

            setLeagues(leaguesData);

            const savedLeagueId = localStorage.getItem('selectedLeague');
            if (savedLeagueId && leaguesData.some((l) => l.league_id === savedLeagueId)) {
                setSelectedLeague(savedLeagueId);
            }
        } catch (err) {
            console.error('Error fetching Sleeper leagues:', err);
        }
        setLoadingLeagues(false);
    };

    const loadRoster = async () => {
        if (!selectedLeague) return;

        setLoadingRoster(true);
        try {
            const rostersRes = await fetch(`https://api.sleeper.app/v1/league/${selectedLeague}/rosters`);
            const rostersData = await rostersRes.json();

            const sleeperUserRes = await fetch(`https://api.sleeper.app/v1/user/${sleeperUsername}`);
            const sleeperUserData = await sleeperUserRes.json();

            const myRoster = rostersData.find((r) => r.owner_id === sleeperUserData.user_id);
            const playerList = myRoster?.players || [];

            setRoster(playerList);
            localStorage.setItem('savedRoster', JSON.stringify(playerList));
            localStorage.setItem('selectedLeague', selectedLeague);
        } catch (err) {
            console.error('Error fetching roster:', err);
        }
        setLoadingRoster(false);
    };

    useEffect(() => {
        const fetchSleeperPlayers = async () => {
            try {
                const res = await fetch('https://api.sleeper.app/v1/players/nfl');
                const data = await res.json();
                setSleeperPlayers(data);
            } catch (err) {
                console.error('Error fetching Sleeper player data:', err);
            }
        };

        fetchSleeperPlayers();
    }, []);

    const getPlayerData = (sleeperId) => {
        const sleeperPlayer = sleeperPlayers[sleeperId];
        const playerName = sleeperPlayer?.full_name || sleeperPlayer?.name || sleeperId;

        const market = playerMap[playerName];
        const personal = userPlayers.find(
            (p) => p.Player === playerName || p.Name === playerName || p.name === playerName
        );

        return {
            name: playerName,
            marketValue: market?.value ?? 0,
            personalValue: personal?.value ?? null,
            delta:
                market?.value != null && personal?.value != null
                    ? Number(personal.value - market.value)
                    : null,
        };
    };

    const playerDataList = roster.map(getPlayerData);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const sortedPlayers = [...playerDataList].sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    const renderSortArrow = (key) => {
        if (sortKey !== key) return null;
        return sortAsc ? ' ▲' : ' ▼';
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>My Team</h1>
            <p className={styles.instructions}>
                Compare your team’s players to the market and your personal rankings.
            </p>

            <div className={styles.inputRow}>
                <input
                    type="text"
                    placeholder="Enter Sleeper username"
                    value={sleeperUsername}
                    onChange={(e) => {
                        setSleeperUsername(e.target.value);
                        localStorage.setItem('sleeperUsername', e.target.value);
                    }}
                    className={styles.inputField}
                />

                <button onClick={loadLeagues} className={styles.buttonPrimary}>
                    {loadingLeagues ? 'Loading...' : 'Load Leagues'}
                </button>
            </div>

            {leagues.length > 0 && (
                <div className={styles.inputRow}>
                    <label htmlFor="league-select">Select League:</label>
                    <select
                        id="league-select"
                        value={selectedLeague}
                        onChange={(e) => {
                            setSelectedLeague(e.target.value);
                            localStorage.setItem('selectedLeague', e.target.value);
                        }}
                        className={styles.selectField}
                    >
                        <option value="">-- Choose a league --</option>
                        {leagues.map((league) => (
                            <option key={league.league_id} value={league.league_id}>
                                {league.name}
                            </option>
                        ))}
                    </select>

                    <button onClick={loadRoster} className={styles.buttonSecondary} disabled={!selectedLeague}>
                        {loadingRoster ? 'Loading...' : 'Load My Roster'}
                    </button>
                </div>
            )}

            {roster.length > 0 && (
                <>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                                        Player{renderSortArrow('name')}
                                    </th>
                                    <th onClick={() => toggleSort('marketValue')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                        Market Value{renderSortArrow('marketValue')}
                                    </th>
                                    <th onClick={() => toggleSort('personalValue')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                        My Value{renderSortArrow('personalValue')}
                                    </th>
                                    <th onClick={() => toggleSort('delta')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                        Delta{renderSortArrow('delta')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPlayers.map((p) => (
                                    <tr key={p.name}>
                                        <td>{p.name}</td>
                                        <td style={{ textAlign: 'right' }}>{p.marketValue.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {p.personalValue != null ? p.personalValue.toFixed(2) : '—'}
                                        </td>
                                        <td
                                            style={{ textAlign: 'right' }}
                                            className={p.delta > 0 ? styles.deltaPositive : styles.deltaNegative}
                                        >
                                            {p.delta != null ? (p.delta > 0 ? '+' : '') + p.delta.toFixed(2) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.mobileSortWrapper}>
                        <label htmlFor="mobileSort">Sort by:</label>
                        <select
                            id="mobileSort"
                            value={sortKey}
                            onChange={(e) => {
                                setSortKey(e.target.value);
                                setSortAsc(true);
                            }}
                        >
                            <option value="name">Player</option>
                            <option value="marketValue">Market Value</option>
                            <option value="personalValue">My Value</option>
                            <option value="delta">Delta</option>
                        </select>

                        <button
                            onClick={() => setSortAsc(!sortAsc)}
                            aria-label="Toggle ascending/descending"
                            className={styles.sortDirectionBtn}
                        >
                            {sortAsc ? '▲' : '▼'}
                        </button>
                    </div>

                    <div className={styles.mobileCardList}>
                        {sortedPlayers.map((p) => (
                            <div key={p.name} className={styles.mobileCard}>
                                <div className={styles.mobileCardRow}>
                                    <strong>Player:</strong>
                                    <span>{p.name}</span>
                                </div>
                                <div className={styles.mobileCardRow}>
                                    <strong>Market Value:</strong>
                                    <span>{p.marketValue.toFixed(2)}</span>
                                </div>
                                <div className={styles.mobileCardRow}>
                                    <strong>My Value:</strong>
                                    <span>{p.personalValue != null ? p.personalValue.toFixed(2) : '—'}</span>
                                </div>
                                <div className={styles.mobileCardRow}>
                                    <strong>Delta:</strong>
                                    <span className={p.delta > 0 ? styles.deltaPositive : styles.deltaNegative}>
                                        {p.delta != null ? (p.delta > 0 ? '+' : '') + p.delta.toFixed(2) : '—'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
