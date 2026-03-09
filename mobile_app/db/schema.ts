import {appSchema, tableSchema} from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    // Reference tables (read-only, pulled from server)
    tableSchema({
      name: 'work_orders',
      columns: [
        {name: 'server_id', type: 'string', isIndexed: true},
        {name: 'work_order_number', type: 'string'},
        {name: 'description', type: 'string', isOptional: true},
        {name: 'project_id', type: 'string'},
        {name: 'deleted', type: 'boolean'},
      ],
    }),
    tableSchema({
      name: 'hour_types',
      columns: [
        {name: 'server_id', type: 'string', isIndexed: true},
        {name: 'name', type: 'string'},
        {name: 'deleted', type: 'boolean'},
      ],
    }),
    tableSchema({
      name: 'employees',
      columns: [
        {name: 'server_id', type: 'string', isIndexed: true},
        {name: 'first_name', type: 'string'},
        {name: 'last_name', type: 'string'},
        {name: 'username', type: 'string'},
        {name: 'role_level_id', type: 'string', isOptional: true},
        {name: 'deleted', type: 'boolean'},
      ],
    }),
    // Write tables (written on mobile, pushed to server)
    tableSchema({
      name: 'time_registries',
      columns: [
        {name: 'server_id', type: 'string', isOptional: true},
        {name: 'work_order_id', type: 'string'},
        {name: 'hour_type_id', type: 'string'},
        {name: 'work_date', type: 'number'},
        {name: 'start_time', type: 'number'},
        {name: 'end_time', type: 'number', isOptional: true},
        {name: 'start_break', type: 'number', isOptional: true},
        {name: 'end_break', type: 'number', isOptional: true},
        {name: 'activity_description', type: 'string', isOptional: true},
        {name: 'additional_info', type: 'string', isOptional: true},
        {name: 'invoice_info', type: 'string', isOptional: true},
        {name: 'invoice_time', type: 'boolean'},
        {name: 'on_site', type: 'boolean'},
        {name: 'is_synced', type: 'boolean'},
        {name: 'created_by', type: 'string'},
      ],
    }),
    tableSchema({
      name: 'time_registry_employees',
      columns: [
        {name: 'server_id', type: 'string', isOptional: true},
        {name: 'time_registry_id', type: 'string', isIndexed: true},
        {name: 'employee_id', type: 'string'},
        {name: 'is_synced', type: 'boolean'},
      ],
    }),
  ],
})
