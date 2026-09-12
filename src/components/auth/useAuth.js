import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '../../config/env';

const API_URL = env.apiBaseUrl;

async function parseAuthResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    await response.text();
    throw new Error('Auth API returned a non-JSON response. Check that the backend is running and API routes are proxied correctly.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || fallbackMessage);
  }

  return data;
}

function normalizeFetchError(error, serviceName) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new Error(`${serviceName} is unreachable. For local dev, start the backend with npm run server. For CloudFront, rebuild without a localhost API URL.`);
  }

  return error;
}

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Login function
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await parseAuthResponse(response, 'Login failed');

      const userInfo = data.userInfo || {
        username,
        isAdmin: !!data.isAdmin,
        role: data.isAdmin ? 'admin' : 'customer',
      };

      // Save tokens to localStorage
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.idToken) localStorage.setItem('idToken', data.idToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

      // Update state
      setAccessToken(data.accessToken || null);
      setUser(userInfo);

      return { ...data, userInfo };
    } catch (error) {
      const normalizedError = normalizeFetchError(error, 'Auth API');
      console.error('Login error:', normalizedError);
      throw normalizedError;
    }
  };

  // Logout function - client-side only
  const logout = async () => {
    // Clear all tokens and user state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  };

  // Get current user info
  const getUserInfo = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }

      const response = await fetch(`${API_URL}/me`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // Token expired or invalid
        await logout();
        throw new Error('Failed to get user info');
      }

      const data = await parseAuthResponse(response, 'Failed to get user info');
      setUser(data.userInfo);
      return data.userInfo;
    } catch (error) {
      const normalizedError = normalizeFetchError(error, 'Auth API');
      console.error('Get user info error:', normalizedError);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    getUserInfo();
  }, []);

  const value = {
    user,
    loading,
    accessToken,
    login,
    logout,
    getUserInfo,
    getAuthHeaders,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for protected routes
export const useRequireAuth = (redirectTo = '/') => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [user, loading, navigate, redirectTo]);

  return { user, loading };
};

// Hook for admin routes
export const useRequireAdmin = (redirectTo = '/') => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate(redirectTo);
    }
  }, [user, loading, isAdmin, navigate, redirectTo]);

  return { user, loading, isAdmin };
};

export default useAuth;
