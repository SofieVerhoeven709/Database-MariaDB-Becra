import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DepartmentActionPlaceholderProps {
  pageTitle: string
  departmentId: string
}

const PREVIEW_ROWS = [
  {name: 'Example item A', owner: 'To be assigned', status: 'Open'},
  {name: 'Example item B', owner: 'To be assigned', status: 'Planned'},
  {name: 'Example item C', owner: 'To be assigned', status: 'Waiting for data'},
]

export function DepartmentActionPlaceholder({pageTitle, departmentId}: DepartmentActionPlaceholderProps) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This page is ready for content. The table below is a temporary placeholder.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PREVIEW_ROWS.map(row => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.owner}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">Department: {departmentId}</p>
    </div>
  )
}

