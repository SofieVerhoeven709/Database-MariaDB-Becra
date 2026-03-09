import {useEffect, useState} from 'react'
import {Slot, useRouter, useSegments} from 'expo-router'
import {getToken} from '@/lib/secureStore'
import GluestackUIProvider from '@/components/ui/gluestack-ui-provider'
import {DatabaseProvider} from '@nozbe/watermelondb/react'
import {database} from '@/db'
import {AuthProvider} from '@/context/authContext'

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    async function checkAuth() {
      const token = await getToken()
      setIsAuthenticated(!!token)
    }
    void checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated === null) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/home')
    }
  }, [isAuthenticated, segments])

  if (isAuthenticated === null) return null

  return (
    <GluestackUIProvider>
      <AuthProvider>
        <DatabaseProvider database={database}>
          <Slot />
        </DatabaseProvider>
      </AuthProvider>
    </GluestackUIProvider>
  )
}
