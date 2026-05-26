import { createContext, useContext, useState } from 'react'
import { mockUsers, getUserPassword, updateUserPassword } from '../firebase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

const login = async (email, password) => {
  try {
    const found = mockUsers.find(u => u.email === email)
    if (!found) return { success: false }
    let correctPassword = found.password
    try {
      const fromFirebase = await getUserPassword(email)
      if (fromFirebase) correctPassword = fromFirebase
    } catch (e) {
      // Firebase failed, use mockUsers password
    }
    if (correctPassword === password) {
      const safeUser = { ...found }
      delete safeUser.password
      setUser(safeUser)
      localStorage.setItem('currentUser', JSON.stringify(safeUser))
      return { success: true }
    }
    return { success: false }
  } catch (err) {
    console.error('Login error:', err)
    return { success: false }
  }
}
  const changePassword = async (email, oldPassword, newPassword) => {
    const correctPassword = await getUserPassword(email)
    if (correctPassword !== oldPassword) return { success: false, error: 'Old password is wrong!' }
    await updateUserPassword(email, newPassword)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)