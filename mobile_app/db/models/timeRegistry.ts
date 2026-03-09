import {Model} from '@nozbe/watermelondb'
import {field, date} from '@nozbe/watermelondb/decorators'

export default class TimeRegistry extends Model {
  static table = 'time_registries'

  @field('server_id') serverId!: string | null
  @field('work_order_id') workOrderId!: string
  @field('hour_type_id') hourTypeId!: string
  @date('work_date') workDate!: Date
  @date('start_time') startTime!: Date
  @date('end_time') endTime!: Date | null
  @date('start_break') startBreak!: Date | null
  @date('end_break') endBreak!: Date | null
  @field('activity_description') activityDescription!: string | null
  @field('additional_info') additionalInfo!: string | null
  @field('invoice_info') invoiceInfo!: string | null
  @field('invoice_time') invoiceTime!: boolean
  @field('on_site') onSite!: boolean
  @field('is_synced') isSynced!: boolean
  @field('created_by') createdBy!: string
}
