// src/contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Your auth logic here...

  const value = {
    user,
    // other auth methods...
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}