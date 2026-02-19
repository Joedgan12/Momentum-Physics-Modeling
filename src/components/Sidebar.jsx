import React from 'react'
import {
  BarChart3, Users, Zap, Send, TrendingUp, Search, FileText,
  Lightbulb, AlertTriangle, Film, Activity, GitBranch, Archive,
} from 'lucide-react'

const navItems = [
  { name: 'Overview',        icon: BarChart3,     label: 'Overview'        },
  { name: 'Match',           icon: Activity,      label: 'Match'           },
  { name: 'Players',         icon: Users,         label: 'Players'         },
  { name: 'Tactics',         icon: Zap,           label: 'Tactics'         },
  { name: 'Formations',      icon: Send,          label: 'Formations'      },
  { name: 'Counterfactual',  icon: GitBranch,     label: 'Counterfactual'  },
  { name: 'Statistics',      icon: TrendingUp,    label: 'Statistics'      },
  { name: 'Search',          icon: Search,        label: 'Search'          },
  { name: 'Scenarios',       icon: Archive,       label: 'Scenarios'       },
  { name: 'Simulation',      icon: Film,          label: 'Simulation'      },
  { name: 'Coach Report',    icon: FileText,      label: 'Coach Report'    },
  { name: 'Recommendations', icon: Lightbulb,     label: 'Recommendations' },
  { name: 'Risk Analysis',   icon: AlertTriangle, label: 'Risk Analysis'   },
]

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <div className="sidebar">
      {/* Logo mark */}
      <div className="sidebar-logo">
        <div className="logo-icon" title="Elite Momentum Analytics">⚡</div>
      </div>

      {/* Icon-only nav rail */}
      <nav className="sidebar-nav">
        {navItems.map(({ name, icon: Icon, label }) => (
          <div
            key={name}
            className={`nav-item${activeTab === name ? ' active' : ''}`}
            onClick={() => onTabChange(name)}
            data-label={label}
            title={label}
          >
            <Icon size={16} strokeWidth={activeTab === name ? 2.5 : 1.8} />
          </div>
        ))}
      </nav>

      {/* User avatar */}
      <div className="sidebar-user">
        <div className="avatar" title="John Doe — Manager">JD</div>
      </div>
    </div>
  )
}
