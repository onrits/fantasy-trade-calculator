import { useState, useEffect } from 'react';
import TradeInput from '../components/TradeInput';
import playerValues from '../data/playerValues.json';       // static players with values
import draftPickValues from '../data/draftPickValues.json'; // static draft picks with values

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [team1Assets, setTeam1Assets] = useState([]);
  const [team2Assets, setTeam2Assets] = useState([]);

  // Map player values for quick lookup by player name (or id if you prefer)
  const playerValueMap = playerValues.reduce((acc, p) => {
    if (p.Player) acc[p.Player] = p.VALUE || 0;
    return acc;
  }, {});

  // Map draft pick values by "Draft Pick" string
  const draftPickValueMap = draftPickValues.reduce((acc, pick) => {
    if (pick["Draft Pick"]) acc[pick["Draft Pick"]] = pick.Value || 0;
    return acc;
  }, {});

  // Normalize draft picks for use in the app
  const normalizedDraftPicks = draftPickValues
    .filter(p => p["Draft Pick"])
    .map(p => ({
      id: p["Draft Pick"],       // Use Draft Pick string as id
      label: p["Draft Pick"],
      value: draftPickValueMap[p["Draft Pick"]] || 0,
      type: 'Pick',
    }));

  useEffect(() => {
    // If you want to skip fetching players dynamically and just use static playerValues:
    // Normalize playerValues JSON into the format used in the app
    const normalizedPlayers = playerValues.map(p => ({
      id: p.Player,            // Use player name as id (or create your own unique id)
      name: p.Player,
      position: p.Position,
      value: p.VALUE || 0,
      type: 'Player',
    }));

    setPlayers(normalizedPlayers);

    // If you do want to fetch from an API, comment out the above and uncomment below:
    /*
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        const filteredPlayers = Object.values(data)
          .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
          .map(p => ({
            ...p,
            id: String(p.player_id || p.id || p.user_id),
            value: playerValueMap[p.full_name || p.name] || 0, // adjust depending on your API shape
            type: 'Player',
          }));

        setPlayers(filteredPlayers);
      })
      .catch(console.error);
    */
  }, []);

  // Combine all items for selection list
  const allItems = [...players, ...normalizedDraftPicks];

  // Add asset to team 1 with no duplicates by id
  function addToTeam1(item) {
    setTeam1Assets(prev => (prev.find(i => i.id === item.id) ? prev : [...prev, item]));
  }

  // Add asset to team 2 with no duplicates by id
  function addToTeam2(item) {
    setTeam2Assets(prev => (prev.find(i => i.id === item.id) ? prev : [...prev, item]));
  }

  // Remove asset from team 1 by id
  function removeFromTeam1(id) {
    setTeam1Assets(prev => prev.filter(i => i.id !== id));
  }

  // Remove asset from team 2 by id
  function removeFromTeam2(id) {
    setTeam2Assets(prev => prev.filter(i => i.id !== id));
  }

  // Calculate total value of assets for a team
  const totalValue = assets => assets.reduce((sum, a) => sum + (a.value || 0), 0);

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h1>Fantasy Trade Calculator</h1>

      <h2>Team 1 (Total Value: {totalValue(team1Assets).toFixed(2)})</h2>
      <TradeInput allItems={allItems} selectedAssets={team1Assets} onSelect={addToTeam1} />
      <ul>
        {team1Assets.map(asset => (
          <li key={asset.id}>
            {(asset.name || asset.label)} ({asset.type || asset.position || 'Pick'}) - Value: {asset.value?.toFixed(2) || '0.00'}{' '}
            <button onClick={() => removeFromTeam1(asset.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <h2>Team 2 (Total Value: {totalValue(team2Assets).toFixed(2)})</h2>
      <TradeInput allItems={allItems} selectedAssets={team2Assets} onSelect={addToTeam2} />
      <ul>
        {team2Assets.map(asset => (
          <li key={asset.id}>
            {(asset.name || asset.label)} ({asset.type || asset.position || 'Pick'}) - Value: {asset.value?.toFixed(2) || '0.00'}{' '}
            <button onClick={() => removeFromTeam2(asset.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
