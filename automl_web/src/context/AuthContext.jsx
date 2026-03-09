// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage
    try {
      const saved = localStorage.getItem('automl_user')
      if (saved) setUser(JSON.parse(saved))
    } catch {}
    setLoading(false)
  }, [])

  const register = (name, email, password) => {
    // Get existing users
    const users = JSON.parse(localStorage.getItem('automl_users') || '[]')
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered')
    }
    const newUser = { id: Date.now().toString(), name, email, password, createdAt: new Date().toISOString() }
    users.push(newUser)
    localStorage.setItem('automl_users', JSON.stringify(users))
    const { password: _, ...safeUser } = newUser
    localStorage.setItem('automl_user', JSON.stringify(safeUser))
    setUser(safeUser)
    return safeUser
  }

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('automl_users') || '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password')
    const { password: _, ...safeUser } = found
    localStorage.setItem('automl_user', JSON.stringify(safeUser))
    setUser(safeUser)
    return safeUser
  }

  const logout = () => {
    localStorage.removeItem('automl_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
