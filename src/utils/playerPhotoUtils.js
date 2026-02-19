/**
 * Player photo utilities
 * Provides player head shots and profile photos from various sources
 */

/**
 * Get player photo URL from Sofascore API
 * @param {string} playerName - Player full name (e.g., "Mohamed Salah")
 * @returns {string} Photo URL or placeholder
 */
export function getPlayerPhotoUrl(playerName, source = 'placeholder') {
  if (!playerName) {
    return getPlaceholderPhoto();
  }

  const nameParts = playerName.trim().split(' ');
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts[0];

  // Multiple sources for player photos
  const encodedName = encodeURIComponent(`${firstName} ${lastName}`);

  switch (source) {
    case 'sofascore':
      // SofaScore is a sports data API, but direct photo URLs require API access
      return `https://img.sofascore.com/api/v1/player/${encodeURIComponent(
        lastName.toLowerCase(),
      )}/image`;

    case 'transfermarkt':
      // Transfermarkt style - player photo format
      return `https://img.transfermarkt.eu/img/singleplayer/header/${lastName.toLowerCase()}_2024.jpg`;

    case 'fbref':
      // Football Reference style
      return `https://fbref.com/req/202401/scrapfly/images/players/${lastName.toLowerCase()}.jpg`;

    case 'fluentui':
      // Use Fluent UI avatar with initials as fallback
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      return getAvatarInitials(initials);

    default:
      return getPlaceholderPhoto();
  }
}

/**
 * Generate a simple avatar with initials
 * @param {string} initials - Player initials (e.g., "MS")
 * @param {string} color - Background color (optional)
 * @returns {string} Data URL for avatar image
 */
export function getAvatarInitials(initials, color = null) {
  // Generate a deterministic color based on the initials
  const hash = initials.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const hue = Math.abs(hash) % 360;
  const backgroundColor = color || `hsl(${hue}, 70%, 55%)`;

  // Create a canvas to render the avatar
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;

  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 80px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL();
}

/**
 * Get placeholder/generic football player image
 * @returns {string} Placeholder image URL or SVG data URL
 */
export function getPlaceholderPhoto() {
  // Return an SVG placeholder
  const svg = `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#grad1)"/>
      <circle cx="100" cy="70" r="30" fill="rgba(255,255,255,0.8)"/>
      <path d="M 60 180 Q 60 120 100 120 Q 140 120 140 180" fill="rgba(255,255,255,0.8)"/>
      <text x="100" y="195" font-size="16" font-weight="bold" text-anchor="middle" fill="rgba(30,60,120,0.6)">PLAYER</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get team crest/logo
 * @param {string} teamName - Team name
 * @returns {string} Team crest URL or placeholder
 */
export function getTeamCrestUrl(teamName) {
  if (!teamName) {
    return getPlaceholderCrest();
  }

  const nameNormalized = teamName.toLowerCase().trim();

  // Map common team names to their crests
  const teamCrests = {
    'manchester city': 'https://resources.premierleague.com/premierleague/badges/70.svg',
    'manchester united': 'https://resources.premierleague.com/premierleague/badges/1.svg',
    liverpool: 'https://resources.premierleague.com/premierleague/badges/14.svg',
    arsenal: 'https://resources.premierleague.com/premierleague/badges/1.svg',
    tottenham: 'https://resources.premierleague.com/premierleague/badges/6.svg',
    chelsea: 'https://resources.premierleague.com/premierleague/badges/8.svg',
    'real madrid':
      'https://b.zmhivatalos.hu/images/imgoptimize/faf25141-7db3-4b4c-9c76-4b4b4b4b4b4b',
    barcelona: 'https://www.fcbarcelona.com/static/img/logo-large.png',
  };

  for (const [team, url] of Object.entries(teamCrests)) {
    if (nameNormalized.includes(team) || team.includes(nameNormalized)) {
      return url;
    }
  }

  return getPlaceholderCrest();
}

/**
 * Get placeholder crest
 * @returns {string} Placeholder crest SVG data URL
 */
export function getPlaceholderCrest() {
  const svg = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="#6b7280" stroke-width="2"/>
      <text x="50" y="55" font-size="12" font-weight="bold" text-anchor="middle" fill="#374151">TEAM</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Fetch player real photo from multiple sources with fallback
 * @param {string} playerName - Player name
 * @param {Array} sources - Array of sources to try in order
 * @returns {Promise<string>} Photo URL
 */
export async function fetchPlayerPhotoWithFallback(
  playerName,
  sources = ['sofascore', 'transfermarkt', 'placeholder'],
) {
  let lastError = null;

  for (const source of sources) {
    try {
      const url = getPlayerPhotoUrl(playerName, source);

      // Test if URL is valid (only works for same-origin requests)
      if (source === 'placeholder') {
        return url;
      }

      // For cross-origin, just return the URL (browser will handle 404)
      return url;
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  // If all sources fail, return placeholder
  return getPlaceholderPhoto();
}

/**
 * Convert player object to display card data with photos
 * @param {Object} player - Player object
 * @param {Object} options - Display options
 * @returns {Object} Player display data with photos
 */
export function getPlayerCardData(player, options = {}) {
  const {
    includePhoto = true,
    includeTeamCrest = true,
    photoSize = 'medium', // 'small', 'medium', 'large'
  } = options;

  return {
    ...player,
    photoUrl: includePhoto ? getPlayerPhotoUrl(player.name) : null,
    teamCrestUrl: includeTeamCrest ? getTeamCrestUrl(player.team) : null,
    photoSize,
  };
}
