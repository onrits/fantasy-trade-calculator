import { useState, useEffect } from 'react';
import TradeInput from '../components/TradeInput';
import draftPicks from '../data/draftPicks';

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [team1Assets, setTeam1Assets] = useState([]);
  const [team2Assets, setTeam2Assets] = useState([]);

  useEffect(() => {
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        // Normalize players with string IDs
        const filteredPlayers = Object.values(data)
          .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.position))
          .map(p => ({
            ...p,
            id: String(p.player_id || p.id || p.user_id),
          }));

        setPlayers(filteredPlayers);
      })
      .catch(console.error);
  }, []);

  // Combine all items, all ids are strings
  const allItems = [
    ...players,
    ...draftPicks, // draftPicks already have string ids
  ];

  // Add asset to team 1 with string ID comparison and no duplicates
  function addToTeam1(item) {
    setTeam1Assets(prev => {
      if (prev.find(i => String(i.id) === String(item.id))) return prev;
      return [...prev, item];
    });
  }

  // Add asset to team 2 with string ID comparison and no duplicates
  function addToTeam2(item) {
    setTeam2Assets(prev => {
      if (prev.find(i => String(i.id) === String(item.id))) return prev;
      return [...prev, item];
    });
  }

  // Remove asset from team 1 by id
  function removeFromTeam1(id) {
    setTeam1Assets(prev => prev.filter(i => String(i.id) !== String(id)));
  }

  // Remove asset from team 2 by id
  function removeFromTeam2(id) {
    setTeam2Assets(prev => prev.filter(i => String(i.id) !== String(id)));
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h1>Fantasy Trade Calculator</h1>

      <h2>Team 1</h2>
      <TradeInput allItems={allItems} selectedAssets={team1Assets} onSelect={addToTeam1} />
      <ul>
        {team1Assets.map(asset => (
          <li key={asset.id}>
            {/* Show player name/full_name or draft pick label */}
            {(asset.name || asset.full_name || asset.label)} ({asset.type || asset.position || 'Pick'}){' '}
            <button onClick={() => removeFromTeam1(asset.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <h2>Team 2</h2>
      <TradeInput allItems={allItems} selectedAssets={team2Assets} onSelect={addToTeam2} />
      <ul>
        {team2Assets.map(asset => (
          <li key={asset.id}>
            {(asset.name || asset.full_name || asset.label)} ({asset.type || asset.position || 'Pick'}){' '}
            <button onClick={() => removeFromTeam2(asset.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
