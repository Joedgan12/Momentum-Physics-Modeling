/**
 * Player name formatting utilities
 * Handles shortened names while maintaining clarity for similar names
 */

/**
 * Generate a shortened version of a player name
 * @param {string} fullName - Full player name (e.g., "Mohamed Salah")
 * @param {string} mode - Shortening mode: 'short' (5 chars), 'medium' (8 chars), 'long' (full)
 * @returns {string} Shortened name
 */
export function shortenPlayerName(fullName, mode = 'medium') {
  if (!fullName) return '?';

  if (mode === 'long') return fullName;

  const parts = fullName.trim().split(' ');

  if (parts.length === 1) {
    // Single name - truncate
    if (mode === 'short') return fullName.substring(0, 5);
    if (mode === 'medium') return fullName.substring(0, 8);
    return fullName;
  }

  // Multiple parts - use first initial(s) + last name
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  if (mode === 'short') {
    // Format: "F.Last" (5 chars max)
    const shortLast = lastName.substring(0, 4);
    return `${firstName.charAt(0)}.${shortLast}`.substring(0, 5);
  }

  if (mode === 'medium') {
    // Format: "First Last" or "F.LastName" (8 chars max)
    if (firstName.length + lastName.length + 1 <= 8) {
      return `${firstName} ${lastName}`.substring(0, 8);
    }
    const shortLast = lastName.substring(0, 6);
    return `${firstName.charAt(0)}.${shortLast}`.substring(0, 8);
  }

  return fullName;
}

/**
 * Create abbreviated version for field display (very space constrained)
 * @param {string} fullName - Full player name
 * @returns {string} Abbreviated name (3-4 chars)
 */
export function getPlayerAbbreviation(fullName) {
  if (!fullName) return '?';

  const parts = fullName.trim().split(' ');

  if (parts.length === 1) {
    return fullName.substring(0, 3).toUpperCase();
  }

  // Use first initial + last name first letters
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  // Try combinations
  if ((firstName.charAt(0) + lastName.substring(0, 2)).length <= 4) {
    return (firstName.charAt(0) + lastName.substring(0, 2)).toUpperCase();
  }

  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

/**
 * Compare names to detect similarities
 * Returns similarity score 0-1 (1 = identical, 0 = completely different)
 */
export function getNameSimilarity(name1, name2) {
  if (!name1 || !name2) return 0;

  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  if (n1 === n2) return 1;

  // Check for common substrings
  const parts1 = n1.split(' ');
  const parts2 = n2.split(' ');

  let matches = 0;
  for (const p1 of parts1) {
    if (parts2.some((p2) => p2 === p1 || (p1.length >= 3 && p2.includes(p1)))) {
      matches++;
    }
  }

  return Math.min(1, matches / Math.max(parts1.length, parts2.length));
}

/**
 * Detect if players have similar names in a list
 * @param {Array} players - Array of player objects with 'name' property
 * @returns {Object} Map of player names to similarity warnings
 */
export function detectSimilarNames(players) {
  const similarityMap = {};

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const similarity = getNameSimilarity(players[i].name, players[j].name);

      // Flag if similarity is high (>0.5)
      if (similarity > 0.5 && similarity < 1) {
        if (!similarityMap[players[i].name]) {
          similarityMap[players[i].name] = [];
        }
        if (!similarityMap[players[j].name]) {
          similarityMap[players[j].name] = [];
        }

        similarityMap[players[i].name].push({
          similarTo: players[j].name,
          score: similarity,
        });
        similarityMap[players[j].name].push({
          similarTo: players[i].name,
          score: similarity,
        });
      }
    }
  }

  return similarityMap;
}

/**
 * Format a player name for display with optional distinction
 * @param {string} fullName - Full player name
 * @param {number} playerNumber - Jersey number or player ID
 * @param {boolean} addNumber - Whether to add number to distinguish similar names
 * @returns {string} Formatted name
 */
export function formatPlayerDisplay(fullName, playerNumber = null, addNumber = false) {
  let formatted = shortenPlayerName(fullName, 'medium');

  if (addNumber && playerNumber) {
    formatted = `${formatted} #${playerNumber}`;
  }

  return formatted;
}
