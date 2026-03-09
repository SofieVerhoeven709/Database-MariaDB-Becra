import {Model} from '@nozbe/watermelondb'
import {field} from '@nozbe/watermelondb/decorators'

export default class TimeRegistryEmployee extends Model {
  static table = 'time_registry_employees'

  @field('server_id') serverId!: string | null
  @field('time_registry_id') timeRegistryId!: string
  @field('employee_id') employeeId!: string
  @field('is_synced') isSynced!: boolean
}
