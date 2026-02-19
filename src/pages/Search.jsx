import React, { useState, useMemo, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';
import PlayerCard from '../components/PlayerCard';
import { shortenPlayerName, detectSimilarNames } from '../utils/playerNameUtils';

export default function SearchPage({ simResults }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState({});

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('simulationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const allPlayers = useMemo(() => {
    return simResults?.playerMomentum || [];
  }, [simResults]);

  const filtered = useMemo(() => {
    if (!searchQuery) return allPlayers;
    return allPlayers.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allPlayers]);

  const similarNamesMap = useMemo(() => {
    return detectSimilarNames(allPlayers);
  }, [allPlayers]);

  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">
                <Search size={14} style={{ display: 'inline', marginRight: '6px' }} /> Discovery
              </div>
              <h1>Player Search</h1>
              <p>Find players and statistics across the simulation</p>
            </div>
          </div>

          {/* Search Input */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--surface-1)',
                border: '1px solid var(--border-low)',
                padding: '12px 16px',
                borderRadius: 'var(--panel-radius)',
                fontSize: '14px',
              }}
            >
              <Search size={18} color="var(--plasma)" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search by name, position, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Results */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: settings.showPlayerPhotos
                  ? 'repeat(auto-fill, minmax(150px, 1fr))'
                  : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              {filtered.map((player, idx) => {
                const hasSimilarNames =
                  similarNamesMap[player.name] && similarNamesMap[player.name].length > 0;

                if (settings.showPlayerPhotos) {
                  return <PlayerCard key={idx} player={player} photoSize="medium" />;
                }

                return (
                  <div key={idx} className="panel">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div className="section-title" style={{ fontSize: '12px', margin: 0 }}>
                        {shortenPlayerName(player.name, 'medium')}
                      </div>
                      {hasSimilarNames && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            color: 'var(--warning-color, #ff9800)',
                            fontWeight: '600',
                          }}
                        >
                          <AlertCircle size={13} /> Similar
                        </div>
                      )}
                    </div>
                    {hasSimilarNames && (
                      <div
                        style={{
                          fontSize: '9px',
                          color: 'var(--text-muted)',
                          marginBottom: '8px',
                          padding: '6px 8px',
                          background: 'rgba(255, 152, 0, 0.1)',
                          borderRadius: '4px',
                          borderLeft: '2px solid var(--warning-color, #ff9800)',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: '600',
                            color: 'var(--warning-color, #ff9800)',
                            marginBottom: '2px',
                          }}
                        >
                          Similar names:
                        </div>
                        {similarNamesMap[player.name].map((similar, i) => (
                          <div key={i}>{similar.similarTo}</div>
                        ))}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        marginBottom: '10px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
                          Position
                        </div>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          {player.position || '—'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Team</div>
                        <div
                          style={{
                            fontWeight: '700',
                            color: player.team === 'A' ? 'var(--team-a)' : 'var(--team-b)',
                          }}
                        >
                          {player.team === 'A' ? 'A' : 'B'}
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          marginBottom: '3px',
                        }}
                      >
                        Momentum
                      </div>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          color: 'var(--plasma)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {player.pmu ? player.pmu.toFixed(2) : '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>{searchQuery ? 'No Results Found' : 'No Data Available'}</h3>
              <p>
                {searchQuery
                  ? `No players match "${searchQuery}"`
                  : 'Run a simulation to search and filter players'}
              </p>
            </div>
          )}
        </div>
        <div
          style={{
            width: '300px',
            minWidth: '260px',
            maxWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <AICoach
            matchState={
              simResults
                ? {
                    formation_id: 0,
                    tactic_id: 0,
                    possession_pct: simResults.avgPossession || 50,
                    team_fatigue: simResults.avgTeamFatigue || 50,
                    momentum_pmu: simResults.avgPMU_A || 0,
                    opponent_formation_id: 1,
                    opponent_tactic_id: 0,
                    score_differential: (simResults.goals_a || 0) - (simResults.goals_b || 0),
                  }
                : null
            }
          />
          <QuickInsights simResults={simResults} />
        </div>
      </div>
    </div>
  );
}
