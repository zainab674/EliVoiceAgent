import { authService } from "@/lib/auth";

/**
 * Get the current user ID - either impersonated user or authenticated user
 * This function checks localStorage for impersonation state and support access sessions
 */
export function getCurrentUserId(): string | null {
  // First check for support access session
  const supportSessionData = localStorage.getItem('support_access_session');
  if (supportSessionData) {
    try {
      const parsed = JSON.parse(supportSessionData);
      if (parsed.impersonatedUserData && parsed.impersonatedUserData.id) {
        console.log('Using support access user ID:', parsed.impersonatedUserData.id);
        return parsed.impersonatedUserData.id;
      }
    } catch (error) {
      console.error('Error parsing support access session data in getCurrentUserId:', error);
      localStorage.removeItem('support_access_session');
    }
  }

  // Then check for regular impersonation
  const impersonationData = localStorage.getItem('impersonation');
  if (impersonationData) {
    try {
      const parsed = JSON.parse(impersonationData);
      if (parsed.isImpersonating && parsed.impersonatedUserData) {
        console.log('Using impersonated user ID:', parsed.impersonatedUserData.id);
        return parsed.impersonatedUserData.id;
      }
    } catch (error) {
      console.error('Error parsing impersonation data in getCurrentUserId:', error);
      localStorage.removeItem('impersonation');
    }
  }

  return null; // Will need to fallback to authenticated user
}

/**
 * Get the current user ID with fallback to authenticated user
 * This is an async version that ensures the user is authenticated
 */
export async function getCurrentUserIdAsync(): Promise<string> {
  const impersonatedUserId = getCurrentUserId();
  if (impersonatedUserId) {
    return impersonatedUserId;
  }

  // Fallback to authenticated user
  const user = authService.getCurrentUser();
  if (user) {
    // console.log('Using authenticated user ID from service:', user.id);
    return user.id;
  }

  // If not in memory, try to refresh profile (which checks token)
  try {
    await authService.refreshProfile();
    const freshUser = authService.getCurrentUser();
    if (freshUser) {
      // console.log('Using authenticated user ID after refresh:', freshUser.id);
      return freshUser.id;
    }
  } catch (error) {
    console.error("Error refreshing profile in getCurrentUserIdAsync:", error);
  }

  throw new Error('User not authenticated');
}
