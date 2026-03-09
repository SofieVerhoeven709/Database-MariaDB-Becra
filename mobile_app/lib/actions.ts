import type {Href} from 'expo-router'

export interface Action {
  id: string
  title: string
  description: string
  icon: string
  route: Href
}

export const actions: Action[] = [
  {
    id: 'time',
    title: 'Log Time',
    description: 'Register hours on a work order',
    icon: '⏱',
    route: '/(app)/timeRegistry',
  },
]
