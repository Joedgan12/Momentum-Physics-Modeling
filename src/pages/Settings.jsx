import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  Moon,
  Sun,
  Volume2,
  Eye,
  Palette,
  Bell,
  Zap,
  Save,
  RotateCcw,
  X,
} from 'lucide-react';

export default function Settings({ onClose }) {
  const [settings, setSettings] = useState({
    theme: 'dark',
    soundEnabled: true,
    soundVolume: 70,
    playerNamesDisplay: 'full', // 'full', 'shortened', 'abbreviated'
    showPlayerPhotos: true,
    notificationsEnabled: true,
    autoRefresh: true,
    autoRefreshInterval: 30,
    simulationDetail: 'detailed', // 'basic', 'detailed', 'advanced'
    playerMatchNameLength: 'medium', // 'short', 'medium', 'long'
    highlightSimilarNames: true,
    pitchGridOverlay: false,
    playerHeatmaps: true,
    animationSpeed: 'normal', // 'slow', 'normal', 'fast'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('simulationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('simulationSettings', JSON.stringify(settings));
      alert('Settings saved successfully!');
    } catch (e) {
      console.error('Failed to save settings:', e);
      alert('Failed to save settings');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      const defaults = {
        theme: 'dark',
        soundEnabled: true,
        soundVolume: 70,
        playerNamesDisplay: 'full',
        showPlayerPhotos: true,
        notificationsEnabled: true,
        autoRefresh: true,
        autoRefreshInterval: 30,
        simulationDetail: 'detailed',
        playerMatchNameLength: 'medium',
        highlightSimilarNames: true,
        pitchGridOverlay: false,
        playerHeatmaps: true,
        animationSpeed: 'normal',
      };
      setSettings(defaults);
      localStorage.setItem('simulationSettings', JSON.stringify(defaults));
      applyTheme(defaults.theme);
      alert('Settings reset to defaults');
    }
  };

  // Apply theme changes immediately
  const applyTheme = (themeValue) => {
    const root = document.documentElement;
    if (themeValue === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  };

  // Apply theme on settings change
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  return (
    <div className="page-container">
      <div className="dashboard-body" style={{ flexDirection: 'column', position: 'relative' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s',
            zIndex: 100,
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--surface-2)';
            e.target.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = 'var(--text-muted)';
          }}
          title="Close Settings"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="command-header">
          <div className="command-identity" style={{ paddingRight: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                ⚙️ Configuration
              </span>
            </div>
            <h1>Settings & Preferences</h1>
            <p>Customize your simulation experience and interface behavior</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}
        >
          {/* Display Settings */}
          <div className="panel">
            <div
              className="section-title"
              style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={16} /> Display
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Theme */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  Theme
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSettingChange('theme', 'dark')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: `2px solid ${
                        settings.theme === 'dark' ? 'var(--plasma)' : 'var(--border-subtle)'
                      }`,
                      background:
                        settings.theme === 'dark' ? 'rgba(255, 102, 255, 0.1)' : 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Moon size={14} /> Dark
                  </button>
                  <button
                    onClick={() => handleSettingChange('theme', 'light')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: `2px solid ${
                        settings.theme === 'light' ? 'var(--plasma)' : 'var(--border-subtle)'
                      }`,
                      background:
                        settings.theme === 'light' ? 'rgba(255, 102, 255, 0.1)' : 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Sun size={14} /> Light
                  </button>
                </div>
              </div>

              {/* Animation Speed */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  Animation Speed
                </label>
                <select
                  value={settings.animationSpeed}
                  onChange={(e) => handleSettingChange('animationSpeed', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-low)',
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="slow">Slow (0.5x)</option>
                  <option value="normal">Normal (1x)</option>
                  <option value="fast">Fast (1.5x)</option>
                </select>
              </div>

              {/* Pitch Grid */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.pitchGridOverlay}
                  onChange={(e) => handleSettingChange('pitchGridOverlay', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Pitch Grid Overlay
              </label>

              {/* Player Heatmaps */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.playerHeatmaps}
                  onChange={(e) => handleSettingChange('playerHeatmaps', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Player Heatmaps
              </label>
            </div>
          </div>

          {/* Player Display Settings */}
          <div className="panel">
            <div
              className="section-title"
              style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} /> Player Display
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Player Names Display */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  Name Format
                </label>
                <select
                  value={settings.playerNamesDisplay}
                  onChange={(e) => handleSettingChange('playerNamesDisplay', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-low)',
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="full">Full Name</option>
                  <option value="shortened">Shortened Name</option>
                  <option value="abbreviated">Abbreviated (First Initial + Last)</option>
                </select>
              </div>

              {/* Name Length on Field */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  On-Field Display Length
                </label>
                <select
                  value={settings.playerMatchNameLength}
                  onChange={(e) => handleSettingChange('playerMatchNameLength', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-low)',
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="short">Short (5 chars)</option>
                  <option value="medium">Medium (8 chars)</option>
                  <option value="long">Long (Full Name)</option>
                </select>
              </div>

              {/* Show Player Photos */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.showPlayerPhotos}
                  onChange={(e) => handleSettingChange('showPlayerPhotos', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Show Player Photos
              </label>

              {/* Highlight Similar Names */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.highlightSimilarNames}
                  onChange={(e) => handleSettingChange('highlightSimilarNames', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Highlight Similar Names
              </label>
            </div>
          </div>

          {/* Audio & Notifications */}
          <div className="panel">
            <div
              className="section-title"
              style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={16} /> Notifications & Audio
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Notifications */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Enable Notifications
              </label>

              {/* Sound Settings */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Enable Sound
              </label>

              {/* Sound Volume */}
              {settings.soundEnabled && (
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Volume2 size={14} /> Volume: {settings.soundVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume}
                    onChange={(e) => handleSettingChange('soundVolume', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Simulation Settings */}
          <div className="panel">
            <div
              className="section-title"
              style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '700' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} /> Simulation
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Simulation Detail Level */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  Detail Level
                </label>
                <select
                  value={settings.simulationDetail}
                  onChange={(e) => handleSettingChange('simulationDetail', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-low)',
                    background: 'var(--surface-1)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="basic">Basic (Faster)</option>
                  <option value="detailed">Detailed</option>
                  <option value="advanced">Advanced (Slower)</option>
                </select>
              </div>

              {/* Auto Refresh */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Auto-Refresh Data
              </label>

              {/* Auto Refresh Interval */}
              {settings.autoRefresh && (
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    Refresh Interval: {settings.autoRefreshInterval}s
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="10"
                    value={settings.autoRefreshInterval}
                    onChange={(e) =>
                      handleSettingChange('autoRefreshInterval', parseInt(e.target.value))
                    }
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--surface-2)';
              e.target.style.borderColor = 'var(--border-low)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--plasma), #ff00ff)',
              color: '#000',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(255, 102, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <Save size={14} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
