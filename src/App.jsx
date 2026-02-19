import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Overview from './pages/Overview';
import Match3D from './pages/Match3D';
import Players from './pages/Players';
import Tactics from './pages/Tactics';
import Formations from './pages/Formations';
import StreamingSweep from './components/StreamingSweep';
import Statistics from './pages/Statistics';
import Search from './pages/Search';
import CoachReport from './pages/CoachReport';
import Recommendations from './pages/Recommendations';
import RiskAnalysis from './pages/RiskAnalysis';
import Playback from './pages/Playback';
import Scenarios from './pages/Scenarios';
import Settings from './pages/Settings';
import NotificationsModal from './components/NotificationsModal';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [scenario, setScenario] = useState('Baseline');
  const [simRunning, setSimRunning] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [simError, setSimError] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [selectedTactic, setSelectedTactic] = useState('balanced');
  // New controls: iterations for Monte Carlo and playback speed for 3D viewer
  const [iterations, setIterations] = useState(500);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-redirect to Playback after simulation completes
  useEffect(() => {
    if (simResults && !simRunning) {
      setActiveTab('Simulation');
    }
  }, [simResults, simRunning]);

  // Load and apply theme on app start
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('simulationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.theme === 'light') {
          document.documentElement.classList.add('light-theme');
        }
      }
    } catch (e) {
      console.error('Failed to load theme preference:', e);
    }
  }, []);

  const handleRunSimulation = useCallback(async () => {
    setSimRunning(true);
    setSimError(null);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation: selectedFormation,
          formation_b: '4-4-2',
          tactic: selectedTactic,
          tactic_b: 'balanced',
          scenario: scenario,
          iterations: iterations,
          start_minute: 0,
          end_minute: 90,
          crowd_noise: 80.0,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Simulation failed');

      setSimResults(json.data);
    } catch (err) {
      console.error('Simulation error:', err);
      setSimError(err.message);
    } finally {
      setSimRunning(false);
    }
  }, [selectedFormation, selectedTactic, scenario, iterations]);

  const renderPage = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <Overview
            onRunSimulation={handleRunSimulation}
            simRunning={simRunning}
            simResults={simResults}
            selectedFormation={selectedFormation}
            onFormationChange={setSelectedFormation}
            selectedTactic={selectedTactic}
            onTacticChange={setSelectedTactic}
            iterations={iterations}
            onIterationsChange={setIterations}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={setPlaybackSpeed}
          />
        );
      case 'Match':
        return (
          <Match3D
            simResults={simResults}
            selectedFormation={selectedFormation}
            selectedTactic={selectedTactic}
            playbackSpeed={playbackSpeed}
          />
        );
      case 'Players':
        return <Players simResults={simResults} />;
      case 'Tactics':
        return (
          <Tactics
            selectedTactic={selectedTactic}
            onTacticChange={setSelectedTactic}
            simResults={simResults}
          />
        );
      case 'Formations':
        return (
          <Formations
            selectedFormation={selectedFormation}
            onFormationChange={setSelectedFormation}
            simResults={simResults}
          />
        );
      case 'Counterfactual':
        return (
          <StreamingSweep
            selectedFormation={selectedFormation}
            selectedTactic={selectedTactic}
            iterations={iterations}
            playbackSpeed={playbackSpeed}
          />
        );
      case 'Statistics':
        return <Statistics simResults={simResults} />;
      case 'Search':
        return <Search simResults={simResults} />;
      case 'Coach Report':
        return <CoachReport simResults={simResults} />;
      case 'Recommendations':
        return <Recommendations simResults={simResults} />;
      case 'Risk Analysis':
        return <RiskAnalysis simResults={simResults} />;
      case 'Simulation':
        return <Playback simResults={simResults} />;
      case 'Scenarios':
        return <Scenarios />;
      case 'Settings':
        return <Settings onClose={() => setShowSettings(false)} />;
      default:
        return (
          <Overview
            onRunSimulation={handleRunSimulation}
            simRunning={simRunning}
            simResults={simResults}
            selectedFormation={selectedFormation}
            onFormationChange={setSelectedFormation}
            selectedTactic={selectedTactic}
            onTacticChange={setSelectedTactic}
            iterations={iterations}
            onIterationsChange={setIterations}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={setPlaybackSpeed}
          />
        );
    }
  };

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="main-content">
        <TopBar
          scenario={scenario}
          onScenarioChange={setScenario}
          simRunning={simRunning}
          simResults={simResults}
          onSettingsClick={() => setShowSettings(true)}
          onNotificationsClick={() => setShowNotifications(true)}
        />
        {simError && (
          <div className="error-banner">
            <span>⚠</span>
            API error: {simError} — ensure the Flask server is running on port 5000.
          </div>
        )}
        <div className="page-wrapper">{renderPage()}</div>
      </div>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showNotifications && (
        <NotificationsModal simResults={simResults} onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}
