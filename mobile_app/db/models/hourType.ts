import {Model} from '@nozbe/watermelondb'
import {field} from '@nozbe/watermelondb/decorators'

export default class HourType extends Model {
  static table = 'hour_types'

  @field('server_id') serverId!: string
  @field('name') name!: string
  @field('deleted') deleted!: boolean
}
