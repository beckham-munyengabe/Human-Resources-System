import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios.js';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('hrms_token');
    const savedUser = localStorage.getItem('hrms_user');
    if (token && savedUser) { setUser(JSON.parse(savedUser)); }
    setLoading(false);
  }, []);
  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('hrms_token', token);
    localStorage.setItem('hrms_user', JSON.stringify(user));
    setUser(user);
    return user;
  };
  const logout = () => { localStorage.removeItem('hrms_token'); localStorage.removeItem('hrms_user'); setUser(null); };
  const isHR = user?.role === 'hr_manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  return <AuthContext.Provider value={{ user, login, logout, loading, isHR, isAdmin }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
