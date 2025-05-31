import { useState, useEffect } from 'react';
import TradeInput from '../components/TradeInput';
import RankingsTable from '../components/RankingsTable';
import Legend from '../components/Legend';

import playerValues from '../data/playerValues.json';       // static players with values
import draftPickValues from '../data/draftPickValues.json'; // static draft picks with values

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [team1Assets, setTeam1Assets] = useState([]);
  const [team2Assets, setTeam2Assets] = useState([]);

  const playerValueMap = playerValues.reduce((acc, p) => {
    if (p.Player) acc[p.Player] = p.VALUE || 0;
    return acc;
  }, {});

  const draftPickValueMap = draftPickValues.reduce((acc, pick) => {
    if (pick["Draft Pick"]) acc[pick["Draft Pick"]] = pick.Value || 0;
    return acc;
  }, {});

  const normalizedDraftPicks = draftPickValues
    .filter(p => p["Draft Pick"])
    .map(p => ({
      id: p["Draft Pick"],
      label: p["Draft Pick"],
      value: draftPickValueMap[p["Draft Pick"]] || 0,
      type: 'Pick',
    }));

  useEffect(() => {
    const normalizedPlayers = playerValues.map(p => ({
      ...p, // <-- keep original fields like TIER, VALUE, Rank
      id: p.Player,
      name: p.Player, // <-- make sure this exists for search
      value: p.VALUE || 0,
      type: 'Player',
    }));

    setPlayers(normalizedPlayers);
  }, []);



  const allItems = [...players, ...normalizedDraftPicks];

  function addToTeam1(item) {
    setTeam1Assets(prev => (prev.find(i => i.id === item.id) ? prev : [...prev, item]));
  }

  function addToTeam2(item) {
    setTeam2Assets(prev => (prev.find(i => i.id === item.id) ? prev : [...prev, item]));
  }

  function removeFromTeam1(id) {
    setTeam1Assets(prev => prev.filter(i => i.id !== id));
  }

  function removeFromTeam2(id) {
    setTeam2Assets(prev => prev.filter(i => i.id !== id));
  }

  const totalValue = assets => assets.reduce((sum, a) => sum + (a.value || 0), 0);

  const sortedPlayers = [...players].sort((a, b) => b.value - a.value);

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', color: '#eee', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '1rem' }}>Fantasy Trade Calculator</h1>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Left Column: Trade Calculator + Legend */}
        <div style={{ flex: '1 1 500px', minWidth: 320 }}>
          <h2>Team 1 (Total Value: {totalValue(team1Assets).toFixed(3)}) Firsts</h2>
          <TradeInput allItems={allItems} selectedAssets={team1Assets} onSelect={addToTeam1} />
          <ul>
            {team1Assets.map(asset => (
              <li key={asset.id} style={{ marginBottom: '0.5rem' }}>
                {(asset.name || asset.label)} ({asset.type || asset.position || 'Pick'}) - Value: {asset.value?.toFixed(2) || '0.00'}{' '}
                <button onClick={() => removeFromTeam1(asset.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <h2>Team 2 (Total Value: {totalValue(team2Assets).toFixed(3)}) Firsts</h2>
          <TradeInput allItems={allItems} selectedAssets={team2Assets} onSelect={addToTeam2} />
          <ul>
            {team2Assets.map(asset => (
              <li key={asset.id} style={{ marginBottom: '0.5rem' }}>
                {(asset.name || asset.label)} ({asset.type || asset.position || 'Pick'}) - Value: {asset.value?.toFixed(2) || '0.00'}{' '}
                <button onClick={() => removeFromTeam2(asset.id)}>Remove</button>
              </li>
            ))}
          </ul>

          {/* Legend BELOW Trade Calculator */}
          <div style={{ marginTop: '2rem' }}>
            <Legend />
          </div>
        </div>

        {/* Right Column: Rankings */}
        <div style={{ flex: '1 1 400px', minWidth: 300 }}>
          <h2>Current Rankings & Values</h2>
          <RankingsTable rankings={sortedPlayers} />
        </div>
      </div>
    </div>
  );
}
