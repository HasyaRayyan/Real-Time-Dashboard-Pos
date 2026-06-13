import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { initiateSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pos_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        // Connect socket when user is logged in
        initiateSocket();
      } catch (error) {
        console.error('Session validation failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token: receivedToken, user: receivedUser } = response.data;
      
      localStorage.setItem('pos_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      
      // Connect socket on successful login
      initiateSocket();
      return { success: true };
    } catch (error) {
      console.error('Login request failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check network connection.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isCashier: user?.role === 'CASHIER' || user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
