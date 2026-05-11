import { createContext, useContext, useState, useEffect } from 'react'
import { mockUsers } from '../firebase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  const login = (email, password) => {
    const found = mockUsers.find(u => u.email === email && u.password === password)
    if (found) {
      setUser(found)
      localStorage.setItem('currentUser', JSON.stringify(found))
      return { success: true }
    }
    return { success: false }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)