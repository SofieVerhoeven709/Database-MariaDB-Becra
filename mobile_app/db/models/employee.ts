import {Model} from '@nozbe/watermelondb'
import {field} from '@nozbe/watermelondb/decorators'

export default class Employee extends Model {
  static table = 'employees'

  @field('server_id') serverId: string
  @field('first_name') firstName: string
  @field('last_name') lastName: string
  @field('username') username: string
  @field('role_level_id') roleLevelId: string
  @field('deleted') deleted: boolean
}
