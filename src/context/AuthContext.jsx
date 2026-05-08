import { createContext, useContext, useState } from 'react'
import { mockUsers } from '../firebase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    const found = mockUsers.find(u => u.email === email && u.password === password)
    if (found) { setUser(found); return { success: true } }
    return { success: false }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)