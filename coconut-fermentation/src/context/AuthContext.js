import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('csf_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('csf_notif_prefs');
      return stored ? JSON.parse(stored) : {
        iot: { inApp: true, email: false, sms: false },
        fermentation: { inApp: true, email: false, sms: false }
      };
    } catch {
      return {
        iot: { inApp: true, email: false, sms: false },
        fermentation: { inApp: true, email: false, sms: false }
      };
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('csf_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('csf_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('csf_notif_prefs', JSON.stringify(notifPrefs));
  }, [notifPrefs]);

  const signup = (data) => {
    const accounts = JSON.parse(localStorage.getItem('csf_accounts') || '[]');
    const exists = accounts.find(a => a.email === data.email || a.mobile === data.mobile);
    if (exists) return { success: false, error: 'Email or mobile number already registered.' };

    const newUser = {
      id: Date.now(),
      fullName: data.fullName,
      email: data.email,
      mobile: data.mobile,
      organization: data.organization || '',
      password: data.password
    };
    accounts.push(newUser);
    localStorage.setItem('csf_accounts', JSON.stringify(accounts));
    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    return { success: true };
  };

  const login = (identifier, password) => {
    const accounts = JSON.parse(localStorage.getItem('csf_accounts') || '[]');
    const match = accounts.find(
      a => (a.email === identifier || a.mobile === identifier) && a.password === password
    );
    if (!match) return { success: false, error: 'Invalid credentials. Please try again.' };
    const { password: _, ...safeUser } = match;
    setUser(safeUser);
    return { success: true };
  };

  const logout = () => setUser(null);

  const updateProfile = (data) => {
    const accounts = JSON.parse(localStorage.getItem('csf_accounts') || '[]');
    const idx = accounts.findIndex(a => a.id === user.id);
    if (idx !== -1) {
      accounts[idx] = { ...accounts[idx], ...data };
      localStorage.setItem('csf_accounts', JSON.stringify(accounts));
    }
    const updated = { ...user, ...data };
    setUser(updated);
  };

  const updateNotifPrefs = (prefs) => setNotifPrefs(prefs);

  return (
    <AuthContext.Provider value={{ user, notifPrefs, signup, login, logout, updateProfile, updateNotifPrefs }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
