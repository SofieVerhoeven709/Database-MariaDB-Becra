import {clsx, type ClassValue} from 'clsx'
import {twMerge} from 'tailwind-merge'
import {Profile} from '@/models/employees'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Indent a string with a given number of spaces on each line except the first.
 *
 * @param text The text to indent.
 * @param spaces The number of spaces to indent with.
 * @return The indented multi-line string.
 */
export function indentMultiline(text: string, spaces = 4): string {
  const indent = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line, i) => (i === 0 ? line : indent + line))
    .join('\n')
}

export function generateProjectNumber() {
  const now = new Date()

  const year = now.getFullYear().toString().slice(-2) // 26
  const month = String(now.getMonth() + 1).padStart(2, '0') // 02
  const day = String(now.getDate()).padStart(2, '0') // 24

  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0') // two random digits

  return `P${year}${month}${day}${random}`
}

export function generateWorkOrderNumber() {
  const now = new Date()

  const year = now.getFullYear().toString().slice(-2) // 26
  const month = String(now.getMonth() + 1).padStart(2, '0') // 02
  const day = String(now.getDate()).padStart(2, '0') // 24

  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0') // two random digits

  return `WO${year}${month}${day}${random}`
}

export function generateCompanyNumber() {
  const now = new Date()

  const year = now.getFullYear().toString().slice(-2) // 26
  const month = String(now.getMonth() + 1).padStart(2, '0') // 02
  const day = String(now.getDate()).padStart(2, '0') // 24

  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0') // two random digits

  return `CO${year}${month}${day}${random}`
}

// Used for admin/global pages
export function getGlobalRoleInfo(profile: Profile) {
  const entries = profile.RoleLevelEmployee ?? []

  const isAdmin = entries.some(rle => rle.RoleLevel.Role.name === 'Administrator')
  const maxLevel = Math.max(0, ...entries.map(rle => rle.RoleLevel.SubRole.level))
  const topRole = entries.find(rle => rle.RoleLevel.SubRole.level === maxLevel)

  return {
    currentUserRole: isAdmin ? 'Administrator' : (topRole?.RoleLevel.Role.name ?? ''),
    currentUserLevel: maxLevel,
  }
}

// Used for department-specific pages
export function getDepartmentRoleInfo(profile: Profile, departmentName: string) {
  const entries = profile.RoleLevelEmployee ?? []

  // Check for admin first — admins bypass department filtering
  const isAdmin = entries.some(rle => rle.RoleLevel.Role.name === 'Administrator')
  if (isAdmin) {
    return {currentUserRole: 'Administrator', currentUserLevel: 100}
  }

  // Find role specific to this department
  const deptEntry = entries.find(rle => rle.RoleLevel.Role.name === `${departmentName} Role`)

  if (deptEntry) {
    return {
      currentUserRole: deptEntry.RoleLevel.Role.name,
      currentUserLevel: deptEntry.RoleLevel.SubRole.level,
    }
  }

  // Fallback — user has no department-specific role, use their highest global level
  const maxLevel = Math.max(0, ...entries.map(rle => rle.RoleLevel.SubRole.level))
  const topRole = entries.find(rle => rle.RoleLevel.SubRole.level === maxLevel)

  return {
    currentUserRole: topRole?.RoleLevel.Role.name ?? '',
    currentUserLevel: maxLevel,
  }
}
