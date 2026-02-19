import React from 'react';
import { ChevronDown, Bell, Settings } from 'lucide-react';

export default function TopBar({
  scenario,
  onScenarioChange,
  simRunning = false,
  simResults = null,
  onSettingsClick,
  onNotificationsClick,
}) {
  const scenarios = ['Baseline', 'Aggressive', 'Defensive', 'Possession', 'Counter'];
  const notificationBadgeCount = 0;

  const avgPMU = simResults?.avgPMU?.toFixed(1) ?? '—';
  const xg = simResults?.xg ?? '—';
  const iters = simResults?.iterations ?? '—';

  return (
    <div className="topbar">
      {/* Scenario selector */}
      <div
        className="scenario-select"
        onClick={() => {
          const i = scenarios.indexOf(scenario);
          onScenarioChange(scenarios[(i + 1) % scenarios.length]);
        }}
        title="Cycle scenario"
      >
        <span>{scenario}</span>
        <ChevronDown size={13} />
      </div>

      {/* Live status */}
      <div className="live-badge">
        <div className={`live-dot${simRunning ? '' : ''}`}></div>
        {simRunning ? 'COMPUTING' : 'LIVE'}
      </div>

      <div className="topbar-spacer" />

      {/* System readout — only meaningful values when sim ran */}
      <div className="topbar-status">
        <div className="topbar-status-item">
          <span>PMU</span>
          <span className="topbar-status-value">{avgPMU}</span>
        </div>
        <div className="topbar-status-item">
          <span>xG</span>
          <span className="topbar-status-value">{xg}</span>
        </div>
        <div className="topbar-status-item">
          <span>N</span>
          <span className="topbar-status-value">{iters}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        <button
          className="icon-btn"
          title="Notifications"
          onClick={onNotificationsClick}
          style={{ position: 'relative' }}
        >
          <Bell size={14} />
          {notificationBadgeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--plasma)',
                color: '#000',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {notificationBadgeCount}
            </span>
          )}
        </button>
        <button className="icon-btn" title="Settings" onClick={onSettingsClick}>
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
