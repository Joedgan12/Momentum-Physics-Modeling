import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Eye, Calendar, Tag, GitCompare } from 'lucide-react';
import AICoach from '../components/AICoach';
import QuickInsights from '../components/QuickInsights';

export default function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedScenarios, setSelectedScenarios] = useState(new Set());
  const [view, setView] = useState('list'); // 'list' | 'comparison' | 'detail'
  const [activeComparison, setActiveComparison] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
    loadComparisons();
  }, []);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scenarios?limit=50');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Failed to load scenarios');
      setScenarios(json.data.scenarios || []);
    } catch (err) {
      console.error('Load scenarios error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadComparisons = useCallback(async () => {
    try {
      const response = await fetch('/api/comparisons?limit=20');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Failed to load comparisons');
      setComparisons(json.data.comparisons || []);
    } catch (err) {
      console.error('Load comparisons error:', err);
    }
  }, []);

  const deleteScenario = useCallback(
    async (scenarioId) => {
      if (!window.confirm('Delete this scenario permanently?')) return;
      try {
        const response = await fetch(`/api/scenarios/${scenarioId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json.ok) {
          setScenarios(scenarios.filter((s) => s.id !== scenarioId));
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [scenarios],
  );

  const toggleSelection = (scenarioId) => {
    const newSelected = new Set(selectedScenarios);
    if (newSelected.has(scenarioId)) {
      newSelected.delete(scenarioId);
    } else {
      newSelected.add(scenarioId);
    }
    setSelectedScenarios(newSelected);
  };

  const createComparison = useCallback(async () => {
    if (selectedScenarios.size < 2) {
      setError('Select at least 2 scenarios to compare');
      return;
    }

    try {
      const response = await fetch('/api/comparisons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Comparison: ${Array.from(selectedScenarios).join(', ')}`,
          scenario_ids: Array.from(selectedScenarios),
          notes: '',
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.ok) {
        setSelectedScenarios(new Set());
        loadComparisons();
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedScenarios, loadComparisons]);

  const viewScenario = async (scenarioId) => {
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.ok) {
        setActiveScenario(json.data.scenario);
        setView('detail');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const viewComparison = async (comparisonId) => {
    try {
      const response = await fetch(`/api/comparisons/${comparisonId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.ok) {
        setActiveComparison(json.data.comparison);
        setView('comparison');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Render scenario detail view
  if (view === 'detail' && activeScenario) {
    return (
      <div className="page-container">
        <div style={{ marginBottom: 20 }}>
          <button
            className="btn-outline"
            onClick={() => {
              setView('list');
              setActiveScenario(null);
            }}
            style={{ marginRight: 12 }}
          >
            ← Back
          </button>
        </div>

        <div
          style={{
            background: 'var(--surface-1)',
            borderRadius: 12,
            border: '1px solid var(--surface-0-3)',
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h2
            style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: 24, fontWeight: 700 }}
          >
            {activeScenario.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
            {activeScenario.description}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--surface-0-3)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Formation A</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--team-a)' }}>
                {activeScenario.formation_a}
              </div>
            </div>
            <div
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--surface-0-3)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tactic A</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--team-a)',
                  textTransform: 'capitalize',
                }}
              >
                {activeScenario.tactic_a}
              </div>
            </div>
            <div
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--surface-0-3)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Opponent Formation</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--team-b)' }}>
                {activeScenario.formation_b}
              </div>
            </div>
            <div
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--surface-0-3)',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Created</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                {new Date(activeScenario.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {activeScenario.tags && activeScenario.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activeScenario.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(139, 92, 246, 0.12)',
                    color: 'var(--violet)',
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Key Metrics Summary */}
        <h3
          style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: 18, fontWeight: 600 }}
        >
          Simulation Results
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {activeScenario.results && (
            <>
              <div
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--surface-0-3)',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Team A Momentum
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--team-a)' }}>
                  {activeScenario.results.avgPMU_A?.toFixed(1) || '--'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>PMU</div>
              </div>
              <div
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--surface-0-3)',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Team B Momentum
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--team-b)' }}>
                  {activeScenario.results.avgPMU_B?.toFixed(1) || '--'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>PMU</div>
              </div>
              <div
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--surface-0-3)',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Expected Goals (xG)
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--plasma)' }}>
                  {activeScenario.results.xg?.toFixed(3) || '--'}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--surface-0-3)',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Goal Probability
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--flare)' }}>
                  {(activeScenario.results.goalProbability * 100)?.toFixed(1) || '--'}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render comparison view
  if (view === 'comparison' && activeComparison) {
    return (
      <div className="page-container">
        <div style={{ marginBottom: 20 }}>
          <button
            className="btn-outline"
            onClick={() => {
              setView('list');
              setActiveComparison(null);
            }}
            style={{ marginRight: 12 }}
          >
            ← Back
          </button>
        </div>

        <h2
          style={{ color: 'var(--text-primary)', marginBottom: 20, fontSize: 24, fontWeight: 700 }}
        >
          {activeComparison.name}
        </h2>

        <div
          style={{
            overflowX: 'auto',
            borderRadius: 8,
            border: '1px solid var(--surface-0-3)',
            marginBottom: 24,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--plasma)', color: 'var(--void)' }}>
                <th style={{ padding: 12, textAlign: 'left', fontWeight: 600 }}>Scenario</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Formation</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Tactic</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Team A PMU</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>xG</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 600 }}>Win Prob</th>
              </tr>
            </thead>
            <tbody>
              {activeComparison.scenarios.map((scenario) => {
                const outcomes = scenario.results?.outcomeDistribution || {};
                return (
                  <tr
                    key={scenario.id}
                    style={{
                      borderBottom: '1px solid var(--surface-0-3)',
                      background: 'var(--surface-0)',
                    }}
                  >
                    <td style={{ padding: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {scenario.name}
                    </td>
                    <td
                      style={{ padding: 12, textAlign: 'center', color: 'var(--text-secondary)' }}
                    >
                      {scenario.formation_a}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        textAlign: 'center',
                        textTransform: 'capitalize',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {scenario.tactic_a}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'var(--team-a)',
                      }}
                    >
                      {scenario.results?.avgPMU_A?.toFixed(1) || '--'}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'var(--plasma)',
                      }}
                    >
                      {scenario.results?.xg?.toFixed(3) || '--'}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {(outcomes.teamA_wins * 100)?.toFixed(1) || '--'}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render list view (default)
  return (
    <div className="page-container">
      <div className="dashboard-body">
        <div style={{ flex: 1 }}>
          <div className="command-header">
            <div className="command-identity">
              <div className="cmd-label">History & Comparison</div>
              <h1>Scenario Management</h1>
              <p>Save, organize, and compare simulation scenarios to track tactical adjustments</p>
            </div>
          </div>

          {error && (
            <div className="error-banner" style={{ marginBottom: '16px' }}>
              ⚠ {error}
            </div>
          )}

          {/* Actions */}
          {selectedScenarios.size > 0 && (
            <div
              className="panel"
              style={{
                background: 'rgba(0, 229, 160, 0.08)',
                borderColor: 'var(--plasma)',
                marginBottom: '18px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <strong style={{ color: 'var(--plasma)', fontSize: '13px', fontWeight: '700' }}>
                    {selectedScenarios.size} scenario(s) selected
                  </strong>
                </div>
                <button
                  className="btn-run"
                  onClick={createComparison}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <GitCompare size={16} />
                  Create Comparison
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 20,
              borderBottom: '2px solid var(--surface-0-3)',
            }}
          >
            <button
              onClick={() => setView('list')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: view === 'list' ? '3px solid var(--plasma)' : 'none',
                background: 'none',
                color: view === 'list' ? 'var(--plasma)' : 'var(--text-secondary)',
                fontWeight: view === 'list' ? 600 : 500,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              📋 Scenarios ({scenarios.length})
            </button>
            <button
              onClick={() => setView('comparisons')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: view === 'comparisons' ? '3px solid var(--plasma)' : 'none',
                background: 'none',
                color: view === 'comparisons' ? 'var(--plasma)' : 'var(--text-secondary)',
                fontWeight: view === 'comparisons' ? 600 : 500,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              🔄 Comparisons ({comparisons.length})
            </button>
          </div>

          {/* Scenarios Tab */}
          {view === 'list' && (
            <>
              {loading ? (
                <div className="empty-state">Loading scenarios...</div>
              ) : scenarios.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    No scenarios saved yet. Run a simulation and save it to get started.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 16,
                  }}
                >
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      style={{
                        border: selectedScenarios.has(scenario.id)
                          ? '2px solid var(--plasma)'
                          : '1px solid var(--surface-0-3)',
                        borderRadius: 12,
                        padding: 16,
                        background: selectedScenarios.has(scenario.id)
                          ? 'rgba(0, 229, 160, 0.06)'
                          : 'var(--surface-1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{ marginBottom: 12 }}>
                        <input
                          type="checkbox"
                          checked={selectedScenarios.has(scenario.id)}
                          onChange={() => toggleSelection(scenario.id)}
                          style={{ marginRight: 8, cursor: 'pointer' }}
                        />
                        <span
                          style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}
                        >
                          {scenario.name}
                        </span>
                      </div>

                      {/* Details */}
                      <div
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          marginBottom: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        <div>
                          <strong>Formation:</strong> {scenario.formation_a} vs{' '}
                          {scenario.formation_b}
                        </div>
                        <div>
                          <strong>Tactic:</strong> {scenario.tactic_a} vs {scenario.tactic_b}
                        </div>
                      </div>

                      {/* Tags */}
                      {scenario.tags && scenario.tags.length > 0 && (
                        <div
                          style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}
                        >
                          {scenario.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                background: 'rgba(139, 92, 246, 0.12)',
                                color: 'var(--violet)',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                        <Calendar size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {new Date(scenario.created_at).toLocaleDateString()}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => viewScenario(scenario.id)}
                          className="btn-outline"
                          style={{ flex: 1, fontSize: 13 }}
                        >
                          <Eye size={14} style={{ marginRight: 4 }} />
                          View
                        </button>
                        <button
                          onClick={() => deleteScenario(scenario.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: 'var(--danger)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: 13,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Comparisons Tab */}
          {view === 'comparisons' && (
            <>
              {comparisons.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔄</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    No comparisons yet. Select scenarios above and create a comparison.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                  }}
                >
                  {comparisons.map((comp) => (
                    <div
                      key={comp.id}
                      style={{
                        border: '1px solid var(--surface-0-3)',
                        borderRadius: 12,
                        padding: 16,
                        background: 'var(--surface-1)',
                        cursor: 'pointer',
                      }}
                      onClick={() => viewComparison(comp.id)}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: 8,
                        }}
                      >
                        {comp.name}
                      </div>
                      <div
                        style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}
                      >
                        {comp.scenario_count} scenarios
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(comp.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
          <AICoach matchState={null} />
          <QuickInsights simResults={null} />
        </div>
      </div>
    </div>
  );
}
