export function getPermissions(currentUserRole: string, currentUserLevel: number) {
  const isAdmin = currentUserRole === 'Administrator' || currentUserLevel >= 100

  return {
    isAdmin,
    canRead: currentUserLevel >= 20,
    canEdit: currentUserLevel >= 40,
    canCreate: currentUserLevel >= 60,
    canDelete: currentUserLevel >= 80,
    canDownloadCsv: currentUserLevel >= 80,
  }
}
