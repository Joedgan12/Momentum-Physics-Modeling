import React, { useState } from 'react'
import { getPlayerPhotoUrl, getAvatarInitials } from '../utils/playerPhotoUtils'

export default function PlayerCard({
  player,
  showPhoto = true,
  photoSize = 'medium',
  compactMode = false,
}) {
  const [photoError, setPhotoError] = useState(false)
  
  const photoSizes = {
    small: { width: '60px', height: '60px', fontSize: '10px' },
    medium: { width: '80px', height: '80px', fontSize: '12px' },
    large: { width: '120px', height: '120px', fontSize: '16px' },
  }
  
  const size = photoSizes[photoSize] || photoSizes.medium
  const initials = player.name
    ? `${player.name.split(' ')[0].charAt(0)}${player.name.split(' ').slice(-1)[0].charAt(0)}`.toUpperCase()
    : '?'
  
  if (compactMode) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px',
        borderRadius: '8px',
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
      }}>
        {showPhoto && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {!photoError ? (
              <img
                src={getPlayerPhotoUrl(player.name)}
                alt={player.name}
                onError={() => setPhotoError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, var(--plasma), #00e5a0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                color: '#000',
              }}>
                {initials}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--text-primary)',
          }}>
            {player.name}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}>
            {player.position}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      borderRadius: '10px',
      background: 'var(--surface-1)',
      border: '1px solid var(--border-subtle)',
      transition: 'all 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--plasma)'
      e.currentTarget.style.background = 'var(--surface-2)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)'
      e.currentTarget.style.background = 'var(--surface-1)'
    }}
    >
      {/* Photo */}
      {showPhoto && (
        <div style={{
          width: '100%',
          paddingTop: '100%',
          position: 'relative',
          background: 'var(--surface-0)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}>
          {!photoError ? (
            <img
              src={getPlayerPhotoUrl(player.name)}
              alt={player.name}
              onError={() => setPhotoError(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, var(--plasma), #00e5a0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontWeight: '700',
              color: '#000',
            }}>
              {initials}
            </div>
          )}
        </div>
      )}
      
      {/* Info */}
      <div>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '700',
          color: 'var(--text-primary)',
        }}>
          {player.name}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginTop: '4px',
        }}>
          {player.position} {player.number && `· #${player.number}`}
        </p>
      </div>
      
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        <div style={{
          padding: '8px',
          background: 'var(--surface-0)',
          borderRadius: '6px',
          fontSize: '10px',
          textAlign: 'center',
        }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>PMU</div>
          <div style={{ fontWeight: '700', color: 'var(--plasma)', fontSize: '14px' }}>
            {player.pmu ? player.pmu.toFixed(1) : '—'}
          </div>
        </div>
        <div style={{
          padding: '8px',
          background: 'var(--surface-0)',
          borderRadius: '6px',
          fontSize: '10px',
          textAlign: 'center',
        }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Team</div>
          <div style={{
            fontWeight: '700',
            color: player.team === 'A' ? 'var(--team-a)' : 'var(--team-b)',
            fontSize: '14px',
          }}>
            {player.team}
          </div>
        </div>
      </div>
    </div>
  )
}
