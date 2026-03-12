import {prismaClient} from '@/dal/prismaClient'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import {Badge} from '@/components/ui/badge'
import {FileText} from 'lucide-react'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'

function formatDate(date: Date | null | undefined) {
  if (!date) return '-'
  return date.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
}

export default async function DocumentPage() {
  await getSessionProfileFromCookieOrThrow()

  const documents = await prismaClient.documentStructure.findMany({
    where: {deleted: false},
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      documentNumber: true,
      descriptionShort: true,
      description: true,
      createdAt: true,
      expiryDate: true,
      revisionNumber: true,
      valid: true,
      process: true,
      Employee_DocumentStructure_createdByToEmployee: {select: {firstName: true, lastName: true}},
      Employee_DocumentStructure_managedByIdToEmployee: {select: {firstName: true, lastName: true}},
    },
  })

  return (
    <main className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">View document records and revisions</p>
        </div>

          {documents.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No documents found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs">Doc. Number</TableHead>
                      <TableHead className="text-xs">Short Description</TableHead>
                      <TableHead className="text-xs">Revision</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-xs">Expiry</TableHead>
                      <TableHead className="text-xs">Managed By</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">
                          {doc.documentNumber}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          <span title={doc.description ?? doc.descriptionShort}>{doc.descriptionShort}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {doc.revisionNumber != null ? `Rev. ${doc.revisionNumber}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(doc.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(doc.expiryDate)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {doc.Employee_DocumentStructure_managedByIdToEmployee
                            ? `${doc.Employee_DocumentStructure_managedByIdToEmployee.firstName} ${doc.Employee_DocumentStructure_managedByIdToEmployee.lastName}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {doc.valid ? (
                              <Badge className="bg-accent/15 text-accent border-0 text-xs">Valid</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Invalid</Badge>
                            )}
                            {doc.process && (
                              <Badge variant="outline" className="text-xs">Process</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{documents.length} document(s)</p>
            </>
          )}
        </div>
      </main>
  )
}
