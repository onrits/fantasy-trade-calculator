import draftPicks from '../data/draftPicks';

export default function DraftPicks() {
    return (
        <div>
            <h1>Draft Picks</h1>
            <ul>
                {draftPicks.map(pick => (
                    <li key={pick.id}>{pick.label}</li>
                ))}
            </ul>
            <p>Showing all draft picks</p>
        </div>
    );
}
