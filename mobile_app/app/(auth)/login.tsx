import {useState} from 'react'
import {View, Text, KeyboardAvoidingView, Platform} from 'react-native'
import {useRouter} from 'expo-router'
import {saveToken} from '@/lib/secureStore'
import {Input, InputField} from '@/components/ui/input'
import {Button, ButtonText} from '@/components/ui/button'
import {useAuth} from '@/context/authContext'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const {setEmployeeId} = useAuth()

  async function handleLogin() {
    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // --- MOCK LOGIN --- replace with api call later
      if (username === 'test' && password === 'test') {
        await saveToken('mock-jwt-token')
        setEmployeeId('mock-employee-id')
        router.replace('/(app)/home')
      } else {
        setError('Invalid username or password')
      }
    } catch (_e) {
      setError('Something went wrong, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900">Becra</Text>
          <Text className="text-gray-500 mt-1">Sign in to your account</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <Input size="md">
            <InputField
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Input>

          <Input size="md">
            <InputField placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </Input>

          {error && <Text className="text-red-500 text-sm">{error}</Text>}

          <Button size="md" onPress={handleLogin} disabled={loading}>
            <ButtonText>{loading ? 'Signing in...' : 'Sign in'}</ButtonText>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
