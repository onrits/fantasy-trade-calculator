import { useState } from 'react';
import TradeInput from '../components/TradeInput';

export default function Home() {
  const [team1Assets, setTeam1Assets] = useState([]);
  const [team2Assets, setTeam2Assets] = useState([]);

  // For now, add to team1 as default
  function addToTeam(item) {
    setTeam1Assets(prev => {
      if (prev.find(i => i.id === item.id)) return prev; // avoid duplicates
      return [...prev, item];
    });
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h1>Fantasy Trade Calculator</h1>
      <TradeInput onSelect={addToTeam} />
      <h2>Team 1</h2>
      <ul>
        {team1Assets.map(asset => (
          <li key={asset.id}>
            {asset.name} ({asset.type})
          </li>
        ))}
      </ul>

      <h2>Team 2</h2>
      <ul>
        {team2Assets.map(asset => (
          <li key={asset.id}>
            {asset.name} ({asset.type})
          </li>
        ))}
      </ul>
    </div>
  );
}
