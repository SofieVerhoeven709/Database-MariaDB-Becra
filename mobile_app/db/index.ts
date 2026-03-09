import {Database} from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import {schema} from './schema'
import {WorkOrder, HourType, Employee, TimeRegistry, TimeRegistryEmployee} from './models'

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'becra',
  jsi: true,
  onSetUpError: error => {
    console.error('Database setup error:', error)
  },
})

export const database = new Database({
  adapter,
  modelClasses: [WorkOrder, HourType, Employee, TimeRegistry, TimeRegistryEmployee],
})
