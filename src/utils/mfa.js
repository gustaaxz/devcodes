export function requiresMfaChallenge(currentLevel, nextLevel) {
  return currentLevel === 'aal1' && nextLevel === 'aal2'
}
