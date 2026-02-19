import React, { useMemo } from 'react'
import { Bell, X, AlertCircle, TrendingUp, Zap, Users, Target, Clock } from 'lucide-react'

export default function NotificationsModal({ simResults, onClose }) {
  // Generate notifications based on simulation results
  const notifications = useMemo(() => {
    const notifs = []

    if (!simResults) {
      notifs.push({
        id: 'no-sim',
        type: 'info',
        icon: Bell,
        title: 'No Simulation Data',
        message: 'Run a simulation to generate insights and notifications',
        timestamp: new Date()
      })
      return notifs
    }

    // High goal threat notification
    if ((simResults.xg || 0) > 2.5) {
      notifs.push({
        id: 'high-xg',
        type: 'warning',
        icon: Target,
        title: 'High Goal Threat Detected',
        message: `Expected goals ratio is elevated at ${(simResults.xg || 0).toFixed(2)}. Both teams showing strong attacking potential.`,
        timestamp: new Date()
      })
    }

    // Momentum advantage
    if (simResults.avgPMU_A && simResults.avgPMU_B) {
      const momentumDiff = Math.abs(simResults.avgPMU_A - simResults.avgPMU_B)
      const leader = simResults.avgPMU_A > simResults.avgPMU_B ? 'Team A' : 'Team B'
      if (momentumDiff > 15) {
        notifs.push({
          id: 'momentum-advantage',
          type: 'success',
          icon: TrendingUp,
          title: 'Significant Momentum Advantage',
          message: `${leader} has a ${momentumDiff.toFixed(1)} PMU advantage. Strong positioning for control.`,
          timestamp: new Date()
        })
      }
    }

    // Possession imbalance
    if (simResults.avgPossession) {
      const poss = simResults.avgPossession
      if (poss > 65 || poss < 35) {
        const team = poss > 65 ? 'Team A' : 'Team B'
        const level = poss > 70 ? 'dominant' : poss < 30 ? 'minimal' : 'significant'
        notifs.push({
          id: 'possession-imbalance',
          type: 'info',
          icon: Users,
          title: 'Possession Imbalance',
          message: `${team} showing ${level} ball possession at ${poss.toFixed(1)}%. Watch for counter-attack opportunities.`,
          timestamp: new Date()
        })
      }
    }

    // Fatigue warning
    if (simResults.avgTeamFatigue && simResults.avgTeamFatigue > 75) {
      notifs.push({
        id: 'team-fatigue',
        type: 'warning',
        icon: AlertCircle,
        title: 'High Team Fatigue Detected',
        message: `Average team fatigue at ${simResults.avgTeamFatigue.toFixed(1)}%. Performance degradation likely in late minutes.`,
        timestamp: new Date()
      })
    }

    // Crowd noise impact
    if (simResults.crowdNoise && simResults.crowdNoise > 85) {
      notifs.push({
        id: 'crowd-impact',
        type: 'info',
        icon: Zap,
        title: 'High Crowd Engagement',
        message: `Crowd noise at ${simResults.crowdNoise.toFixed(0)}%. Significant psychological advantage for home team.`,
        timestamp: new Date()
      })
    }

    // Score differential
    if (simResults.goals_a !== undefined && simResults.goals_b !== undefined) {
      const diff = Math.abs(simResults.goals_a - simResults.goals_b)
      if (diff >= 2) {
        const team = simResults.goals_a > simResults.goals_b ? 'Team A' : 'Team B'
        notifs.push({
          id: 'score-diff',
          type: 'success',
          icon: Target,
          title: 'Commanding Lead',
          message: `${team} leads ${Math.max(simResults.goals_a, simResults.goals_b)}-${Math.min(simResults.goals_a, simResults.goals_b)}. Strong match performance.`,
          timestamp: new Date()
        })
      }
    }

    // Simulation iterations note
    if (simResults.iterations && simResults.iterations < 300) {
      notifs.push({
        id: 'low-iterations',
        type: 'info',
        icon: Clock,
        title: 'Limited Iterations',
        message: `Simulation used only ${simResults.iterations} iterations. Run more iterations for higher accuracy.`,
        timestamp: new Date()
      })
    }

    // High iterations achieved
    if (simResults.iterations && simResults.iterations >= 1000) {
      notifs.push({
        id: 'high-iterations',
        type: 'success',
        icon: TrendingUp,
        title: 'Robust Analysis',
        message: `Simulation completed with ${simResults.iterations} iterations. Results are highly reliable.`,
        timestamp: new Date()
      })
    }

    return notifs
  }, [simResults])

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning': return 'var(--warning-color, #ff9800)'
      case 'success': return 'var(--plasma)'
      case 'error': return 'var(--error-color, #f44336)'
      case 'info':
      default: return 'var(--info-color, #2196f3)'
    }
  }

  const getTypeBackground = (type) => {
    switch (type) {
      case 'warning': return 'rgba(255, 152, 0, 0.1)'
      case 'success': return 'rgba(255, 102, 255, 0.1)'
      case 'error': return 'rgba(244, 67, 54, 0.1)'
      case 'info':
      default: return 'rgba(33, 150, 243, 0.1)'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        maxHeight: '90vh',
        background: 'var(--surface-0)',
        borderRadius: '12px',
        border: '1px solid var(--border-low)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={18} color="var(--plasma)" />
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Notifications</h2>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {notifications.length} active alert{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--surface-2)'
              e.target.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
              e.target.style.color = 'var(--text-muted)'
            }}
            title="Close notifications"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}>
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const IconComponent = notif.icon
              return (
                <div
                  key={notif.id}
                  style={{
                    background: getTypeBackground(notif.type),
                    border: `1px solid ${getTypeColor(notif.type)}66`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '10px',
                    display: 'flex',
                    gap: '12px',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = getTypeColor(notif.type)
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${getTypeColor(notif.type)}66`
                  }}
                >
                  <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: `${getTypeColor(notif.type)}33`,
                  }}>
                    <IconComponent size={16} color={getTypeColor(notif.type)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '12px',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                    }}>
                      {notif.title}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      lineHeight: '1.4',
                    }}>
                      {notif.message}
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '9px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}>
                      {notif.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: 'var(--text-muted)',
            }}>
              <Bell size={32} opacity={0.3} />
              <p style={{ margin: 0, fontSize: '13px' }}>No notifications yet</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Alerts will appear here when simulation events occur
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px',
        }}>
          <button
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
            }}
            onClick={() => {
              // Clear all notifications
              alert('Notifications cleared')
              onClose()
            }}
          >
            Clear All
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--plasma), #ff00ff)',
              color: '#000',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
