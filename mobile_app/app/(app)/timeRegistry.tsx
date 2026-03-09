import {useState} from 'react'
import {View, Text, ScrollView, Pressable, Switch, Platform} from 'react-native'
import {useRouter} from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import {Input, InputField} from '@/components/ui/input'
import {Button, ButtonText} from '@/components/ui/button'
import {useDatabase} from '@nozbe/watermelondb/react'
import {useAuth} from '@/context/authContext'
import type WorkOrder from '@/db/models/workOrder'
import type HourType from '@/db/models/hourType'
import type TimeRegistryModel from '@/db/models/timeRegistry'
import type TimeRegistryEmployeeModel from '@/db/models/timeRegistryEmployee'
import {Q} from '@nozbe/watermelondb'
import {useEffect} from 'react'
import {MOCK_WORK_ORDERS, MOCK_HOUR_TYPES} from '@/lib/mockData'

type DateTimeField = 'workDate' | 'startTime' | 'endTime' | 'startBreak' | 'endBreak'

export default function TimeRegistryScreen() {
  const router = useRouter()
  const database = useDatabase()
  const {employeeId} = useAuth()

  // Data state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [hourTypes, setHourTypes] = useState<HourType[]>([])
  const [useMock, setUseMock] = useState(false)

  // Form state
  const [workOrderId, setWorkOrderId] = useState<string | null>(null)
  const [hourTypeId, setHourTypeId] = useState<string | null>(null)
  const [workDate, setWorkDate] = useState(new Date())
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [startBreak, setStartBreak] = useState<Date | null>(null)
  const [endBreak, setEndBreak] = useState<Date | null>(null)
  const [activityDescription, setActivityDescription] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [invoiceInfo, setInvoiceInfo] = useState('')
  const [invoiceTime, setInvoiceTime] = useState(false)
  const [onSite, setOnSite] = useState(false)

  // Picker state
  const [showPicker, setShowPicker] = useState(false)
  const [activePicker, setActivePicker] = useState<DateTimeField | null>(null)
  const [showWorkOrderPicker, setShowWorkOrderPicker] = useState(false)
  const [showHourTypePicker, setShowHourTypePicker] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load data from WatermelonDB, fall back to mock if empty
  useEffect(() => {
    async function loadData() {
      const woResults = await database.get<WorkOrder>('work_orders').query(Q.where('deleted', false)).fetch()

      const htResults = await database.get<HourType>('hour_types').query(Q.where('deleted', false)).fetch()

      if (woResults.length === 0 || htResults.length === 0) {
        setUseMock(true)
      } else {
        setWorkOrders(woResults)
        setHourTypes(htResults)
      }
    }

    void loadData()
  }, [database])

  // Displayed data — real or mock
  const displayedWorkOrders = useMock
    ? MOCK_WORK_ORDERS
    : workOrders.map(wo => ({
        id: wo.id,
        workOrderNumber: wo.workOrderNumber,
        description: wo.description,
      }))

  const displayedHourTypes = useMock
    ? MOCK_HOUR_TYPES
    : hourTypes.map(ht => ({
        id: ht.id,
        name: ht.name,
      }))

  function openDatePicker(field: DateTimeField) {
    setActivePicker(field)
    setShowPicker(true)
  }

  function getDateValue(field: DateTimeField): Date {
    switch (field) {
      case 'workDate':
        return workDate
      case 'startTime':
        return startTime
      case 'endTime':
        return endTime
      case 'startBreak':
        return startBreak ?? new Date()
      case 'endBreak':
        return endBreak ?? new Date()
    }
  }

  function handleDateChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false)
    if (!selected || !activePicker) return

    switch (activePicker) {
      case 'workDate':
        setWorkDate(selected)
        break
      case 'startTime':
        setStartTime(selected)
        break
      case 'endTime':
        setEndTime(selected)
        break
      case 'startBreak':
        setStartBreak(selected)
        break
      case 'endBreak':
        setEndBreak(selected)
        break
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('nl-BE')
  }

  function formatTime(date: Date | null): string {
    if (!date) return 'Not set'
    return date.toLocaleTimeString('nl-BE', {hour: '2-digit', minute: '2-digit'})
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!workOrderId) newErrors.workOrder = 'Work order is required'
    if (!hourTypeId) newErrors.hourType = 'Hour type is required'
    if (!activityDescription) newErrors.activityDescription = 'Activity description is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    if (!employeeId) return

    await database.write(async () => {
      const timeRegistry = await database.get<TimeRegistryModel>('time_registries').create(record => {
        record.workOrderId = workOrderId!
        record.hourTypeId = hourTypeId!
        record.workDate = workDate
        record.startTime = startTime
        record.endTime = endTime
        record.startBreak = startBreak ?? null
        record.endBreak = endBreak ?? null
        record.activityDescription = activityDescription
        record.additionalInfo = additionalInfo
        record.invoiceInfo = invoiceInfo
        record.invoiceTime = invoiceTime
        record.onSite = onSite
        record.isSynced = false
        record.createdBy = employeeId
      })

      await database.get<TimeRegistryEmployeeModel>('time_registry_employees').create(record => {
        record.timeRegistryId = timeRegistry.id
        record.employeeId = employeeId
        record.isSynced = false
      })
    })

    router.back()
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mb-3">
          <Text className="text-blue-500">← Back</Text>
        </Pressable>
        <Text className="text-2xl font-bold text-gray-900">Log Time</Text>
      </View>

      <View className="p-4 gap-6">
        {/* Work Order */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold mb-3">Work Order</Text>
          <Pressable
            onPress={() => setShowWorkOrderPicker(!showWorkOrderPicker)}
            className="border border-gray-200 rounded-xl p-3">
            <Text className="text-gray-700">
              {workOrderId
                ? displayedWorkOrders.find(wo => wo.id === workOrderId)?.workOrderNumber
                : 'Select work order'}
            </Text>
          </Pressable>
          {showWorkOrderPicker && (
            <View className="mt-2 border border-gray-100 rounded-xl overflow-hidden">
              {displayedWorkOrders.map(wo => (
                <Pressable
                  key={wo.id}
                  onPress={() => {
                    setWorkOrderId(wo.id)
                    setShowWorkOrderPicker(false)
                  }}
                  className="p-3 border-b border-gray-50">
                  <Text className="text-gray-900 font-medium">{wo.workOrderNumber}</Text>
                  <Text className="text-gray-400 text-xs">{wo.description}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {errors.workOrder && <Text className="text-red-500 text-xs mt-1">{errors.workOrder}</Text>}
        </View>

        {/* Hour Type */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold mb-3">Hour Type</Text>
          <Pressable
            onPress={() => setShowHourTypePicker(!showHourTypePicker)}
            className="border border-gray-200 rounded-xl p-3">
            <Text className="text-gray-700">
              {hourTypeId ? displayedHourTypes.find(ht => ht.id === hourTypeId)?.name : 'Select hour type'}
            </Text>
          </Pressable>
          {showHourTypePicker && (
            <View className="mt-2 border border-gray-100 rounded-xl overflow-hidden">
              {displayedHourTypes.map(ht => (
                <Pressable
                  key={ht.id}
                  onPress={() => {
                    setHourTypeId(ht.id)
                    setShowHourTypePicker(false)
                  }}
                  className="p-3 border-b border-gray-50">
                  <Text className="text-gray-900">{ht.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {errors.hourType && <Text className="text-red-500 text-xs mt-1">{errors.hourType}</Text>}
        </View>

        {/* Date & Time */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold mb-3">Date & Time</Text>
          <View className="gap-3">
            <Pressable
              onPress={() => openDatePicker('workDate')}
              className="flex-row justify-between items-center border border-gray-200 rounded-xl p-3">
              <Text className="text-gray-500">Work Date</Text>
              <Text className="text-gray-900">{formatDate(workDate)}</Text>
            </Pressable>
            <Pressable
              onPress={() => openDatePicker('startTime')}
              className="flex-row justify-between items-center border border-gray-200 rounded-xl p-3">
              <Text className="text-gray-500">Start Time</Text>
              <Text className="text-gray-900">{formatTime(startTime)}</Text>
            </Pressable>
            <Pressable
              onPress={() => openDatePicker('endTime')}
              className="flex-row justify-between items-center border border-gray-200 rounded-xl p-3">
              <Text className="text-gray-500">End Time</Text>
              <Text className="text-gray-900">{formatTime(endTime)}</Text>
            </Pressable>
            <Pressable
              onPress={() => openDatePicker('startBreak')}
              className="flex-row justify-between items-center border border-gray-200 rounded-xl p-3">
              <Text className="text-gray-500">Break Start</Text>
              <Text className="text-gray-900">{formatTime(startBreak)}</Text>
            </Pressable>
            <Pressable
              onPress={() => openDatePicker('endBreak')}
              className="flex-row justify-between items-center border border-gray-200 rounded-xl p-3">
              <Text className="text-gray-500">Break End</Text>
              <Text className="text-gray-900">{formatTime(endBreak)}</Text>
            </Pressable>
          </View>
        </View>

        {/* Date Time Picker */}
        {showPicker && activePicker && (
          <DateTimePicker
            value={getDateValue(activePicker)}
            mode={activePicker === 'workDate' ? 'date' : 'time'}
            is24Hour={true}
            onChange={handleDateChange}
          />
        )}

        {/* Details */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold mb-3">Details</Text>
          <View className="gap-3">
            <View>
              <Text className="text-gray-500 text-sm mb-1">Activity Description *</Text>
              <Input size="md">
                <InputField
                  placeholder="Describe the activity..."
                  value={activityDescription}
                  onChangeText={setActivityDescription}
                  multiline
                  numberOfLines={3}
                />
              </Input>
              {errors.activityDescription && (
                <Text className="text-red-500 text-xs mt-1">{errors.activityDescription}</Text>
              )}
            </View>
            <View>
              <Text className="text-gray-500 text-sm mb-1">Additional Info</Text>
              <Input size="md">
                <InputField
                  placeholder="Any additional information..."
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  multiline
                  numberOfLines={2}
                />
              </Input>
            </View>
            <View>
              <Text className="text-gray-500 text-sm mb-1">Invoice Info</Text>
              <Input size="md">
                <InputField placeholder="Invoice information..." value={invoiceInfo} onChangeText={setInvoiceInfo} />
              </Input>
            </View>
          </View>
        </View>

        {/* Toggles */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-700 font-semibold mb-3">Options</Text>
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-gray-700">On Site</Text>
                <Text className="text-gray-400 text-xs">Work performed on site</Text>
              </View>
              <Switch value={onSite} onValueChange={setOnSite} />
            </View>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-gray-700">Invoice Time</Text>
                <Text className="text-gray-400 text-xs">Include in invoice</Text>
              </View>
              <Switch value={invoiceTime} onValueChange={setInvoiceTime} />
            </View>
          </View>
        </View>

        {/* Submit */}
        <Button size="lg" onPress={handleSubmit} className="mb-8">
          <ButtonText>Save Time Entry</ButtonText>
        </Button>
      </View>
    </ScrollView>
  )
}
