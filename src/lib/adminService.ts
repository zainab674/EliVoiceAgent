export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean | null;
  created_on: string | null;
  company: string | null;
  industry: string | null;
}

const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const getAuthToken = () => localStorage.getItem('token');

export class AdminService {
  /**
   * Check if current user is admin
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const token = getAuthToken();
      if (!token) return false;

      // We can check the profile endpoint which returns the role
      const response = await fetch(`${getBackendUrl()}/api/v1/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.user?.role === 'admin' || data.user?.role === 'super-admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await fetch(`${getBackendUrl()}/api/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, updates: Partial<AdminUser>) {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('User not authenticated');

      const response = await fetch(`${getBackendUrl()}/api/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update user');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId: string) {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('User not authenticated');

      const response = await fetch(`${getBackendUrl()}/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete user');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  static async searchUsers(query: string): Promise<AdminUser[]> {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await fetch(`${getBackendUrl()}/api/v1/admin/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to search users');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}
