import {createContext, useContext, useState} from 'react'
import type {ReactNode} from 'react'

interface AuthContextType {
  employeeId: string | null
  setEmployeeId: (id: string | null) => void
}

const AuthContext = createContext<AuthContextType>({
  employeeId: null,
  setEmployeeId: () => {},
})

export function AuthProvider({children}: {children: ReactNode}) {
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  return <AuthContext.Provider value={{employeeId, setEmployeeId}}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
