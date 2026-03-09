import {synchronize} from '@nozbe/watermelondb/sync'
import type {SyncDatabaseChangeSet} from '@nozbe/watermelondb/sync'
import {database} from './index'
import api from '@/lib/api'
import {TimeRegistry} from '@/db/models'

export async function syncDatabase(): Promise<void> {
  await synchronize({
    database,
    pullChanges: async ({lastPulledAt}) => {
      const response = await api.get<{changes: SyncDatabaseChangeSet; timestamp: number}>('/api/sync/pull', {
        params: {lastPulledAt},
      })
      const {changes, timestamp} = response.data
      return {changes, timestamp}
    },
    pushChanges: async ({changes, lastPulledAt}) => {
      await api.post('/api/sync/push', {changes, lastPulledAt})
    },
    migrationsEnabledAtVersion: 1,
  })
}

export async function isSyncNeeded(): Promise<boolean> {
  const timeRegistries = await database.get<TimeRegistry>('time_registries').query().fetch()

  return timeRegistries.some(record => !record.isSynced)
}
