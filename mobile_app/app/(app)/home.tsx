import {View, Text, ScrollView} from 'react-native'
import {useRouter} from 'expo-router'
import {Pressable} from 'react-native'
import {removeToken} from '@/lib/secureStore'
import {actions} from '@/lib/actions'

export default function HomeScreen() {
  const router = useRouter()

  async function handleLogout() {
    await removeToken()
    router.replace('/(auth)/login')
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Becra</Text>
            <Text className="text-gray-500 text-sm mt-1">What would you like to do?</Text>
          </View>
          <Pressable onPress={handleLogout}>
            <Text className="text-red-500 text-sm">Logout</Text>
          </Pressable>
        </View>
      </View>

      {/* Action Grid */}
      <View className="p-4 flex-row flex-wrap gap-4">
        {actions.map(action => (
          <Pressable
            key={action.id}
            onPress={() => router.push(action.route)}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            style={{width: '47%'}}>
            <Text className="text-3xl mb-3">{action.icon}</Text>
            <Text className="text-gray-900 font-semibold text-base">{action.title}</Text>
            <Text className="text-gray-400 text-xs mt-1">{action.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
