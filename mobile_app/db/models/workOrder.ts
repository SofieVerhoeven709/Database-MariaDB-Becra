import {Model} from '@nozbe/watermelondb'
import {field} from '@nozbe/watermelondb/decorators'

export default class WorkOrder extends Model {
  static table = 'work_orders'

  @field('server_id') serverId: string
  @field('work_order_number') workOrderNumber: string
  @field('description') description: string
  @field('project_id') projectId: string
  @field('deleted') deleted: boolean
}
