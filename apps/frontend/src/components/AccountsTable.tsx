"use client"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, User } from "lucide-react"
import PaginationUniversal from "./PaginationUniversal"

interface Account {
  alias: string
  project: string
  username: string
  spam_message?: string
  spam_status?: string
  id: string
  phone_number: string
}

interface AccountsResponse {
  status: string
  accounts: Account[]
  total_count: number
}

interface AccountsTableProps {
  accounts: AccountsResponse | null
  currentPage?: number
  limit?: number
  onPageChange?: (page: number) => void
  loading: boolean
  showPagination?: boolean
}

export default function AccountsTable({ 
  accounts, 
  currentPage = 0, 
  limit = 15, 
  onPageChange, 
  loading, 
  showPagination = true 
}: AccountsTableProps) {
  // Add null checks and default values
  if (!accounts) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const accountsList = accounts.accounts || []
  const totalCount = accounts.total_count || 0
  const totalPages = Math.ceil(totalCount / limit)
  const startItem = showPagination ? currentPage * limit + 1 : 1
  const endItem = showPagination ? Math.min((currentPage + 1) * limit, totalCount) : totalCount

  const getSpamStatusBadge = (status?: string) => {
    if (!status)
      return (
        <Badge variant="secondary" className="text-xs">
          Неизвестно
        </Badge>
      )

    const variant = status === "clean" ? "default" : status === "spam" ? "destructive" : "secondary"
    const text = status === "clean" ? "Чистый" : status === "spam" ? "Спам" : status

    return (
      <Badge variant={variant} className="text-xs">
        {text}
      </Badge>
    )
  }

  const truncateText = (text: string, maxLength: number = 15) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <div className="space-y-4 w-full">
      {/* Total Count Display */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Всего аккаунтов: <span className="font-semibold text-foreground">{totalCount}</span>
        </div>
        {showPagination && (
        <div className="text-sm text-muted-foreground">
          Показано {totalCount > 0 ? startItem : 0}-{totalCount > 0 ? endItem : 0}
        </div>
        )}
      </div>

      {loading && accountsList.length === 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : accountsList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Аккаунты не найдены</p>
        </div>
      ) : (
        <>
          {/* Ultra compact mobile table */}
          <div className="rounded-md border w-full overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold w-[25%] md:w-[30%] lg:w-[35%] text-xs">Псевдоним</TableHead>
                  <TableHead className="font-semibold w-[55%] md:w-[50%] lg:w-[45%] text-xs">Имя пользователя</TableHead>
                  <TableHead className="font-semibold text-center w-[20%] text-xs">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsList.map((account) => (
                  <TableRow key={account.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium w-[25%] md:w-[30%] lg:w-[35%] p-1">
                      <div className="truncate text-xs" title={account.alias}>
                        {truncateText(account.alias, 8)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground w-[55%] md:w-[50%] lg:w-[45%] p-1">
                      <div className="truncate text-xs" title={`@${account.username}`}>
                        {truncateText(account.username, 10)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-[20%] p-1">
                      {getSpamStatusBadge(account.spam_status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Custom Pagination - only show if showPagination is true */}
          {showPagination && totalPages > 1 && onPageChange && (
            <PaginationUniversal
              currentPage={currentPage + 1} // Convert from 0-based to 1-based
              totalPages={totalPages}
              onPageChange={(page) => onPageChange(page - 1)} // Convert back to 0-based
            />
          )}
        </>
      )}
    </div>
  )
}
