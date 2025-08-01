// In-memory store for pending signups
const pendingSignups = {};

export function addPendingSignup(signup) {
  try {
    pendingSignups[signup.email] = signup;
  } catch (error) {
    console.error('addPendingSignup error:', error.message);
    throw new Error('Failed to add pending signup');
  }
}

export function getPendingSignup(email) {
  try {
    return pendingSignups[email];
  } catch (error) {
    console.error('getPendingSignup error:', error.message);
    throw new Error('Failed to get pending signup');
  }
}

export function removePendingSignup(email) {
  try {
    delete pendingSignups[email];
  } catch (error) {
    console.error('removePendingSignup error:', error.message);
    throw new Error('Failed to remove pending signup');
  }
} 