"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import ConversationsChart from "@/components/ConversatiosChart"
import AccountsTable from "@/components/AccountsTable"
import { getConversationsByDate } from "@/shared/api/conversations"
import { getAccounts } from "@/shared/api/accounts"

interface ConversationsByDate {
  [date: string]: number
}

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

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [conversations, setConversations] = useState<ConversationsByDate | null>(null)
  const [accounts, setAccounts] = useState<AccountsResponse | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  const fetchConversations = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setLoadingConversations(true)
    try {
      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      
      const response = await getConversationsByDate(startDate, endDate)
      
      if (response.data) {
        setConversations(response.data)
      } else {
        console.error("Error fetching conversations:", response.error)
        setConversations({})
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setConversations({})
    } finally {
      setLoadingConversations(false)
    }
  }
  
  const fetchAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const response = await getAccounts(1000, 0)
      
      if (response.data) {
        setAccounts(response.data)
      } else {
        console.error("Error fetching accounts:", response.error)
        setAccounts({
          status: "error",
          accounts: [],
          total_count: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      setAccounts({
        status: "error",
        accounts: [],
        total_count: 0,
      })
    } finally {
      setLoadingAccounts(false)
    }
  }

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts()
  }, [])

  return (
    <div className="min-h-screen lg:h-screen overflow-hidden flex flex-col">
      <div className="container mx-auto flex flex-col h-full">
    

        {/* Two column layout - takes remaining space */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 flex-grow min-h-0">
          {/* Left Column - Conversations by Date */}
          <Card className="flex flex-col min-h-0 relative overflow-visible">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg lg:text-xl">Разговоры по датам</CardTitle>
              <CardDescription className="text-sm">Выберите диапазон дат для просмотра статистики разговоров</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow min-h-0 space-y-4 p-4 lg:p-6">
              <div className="flex flex-col gap-4 flex-shrink-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy", { locale: ru })} -{" "}
                            {format(dateRange.to, "dd MMM yyyy", { locale: ru })}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy", { locale: ru })
                        )
                      ) : (
                        <span>Выберите диапазон дат</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={ru}
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={fetchConversations}
                  disabled={!dateRange?.from || !dateRange?.to || loadingConversations}
                  className="text-sm"
                >
                  {loadingConversations && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Загрузить данные
                </Button>
              </div>

              <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
                {!conversations && !loadingConversations && (
                  <div className="text-center py-8 text-muted-foreground flex-grow flex flex-col justify-center">
                    <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">Выберите диапазон дат и нажмите &quot;Загрузить данные&quot; для просмотра статистики разговоров</p>
                  </div>
                )}

                {loadingConversations && (
                  <div className="flex justify-center py-8 flex-grow items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                {conversations && (
                  <div className="flex-grow min-h-0 overflow-hidden">
                    <ConversationsChart data={conversations} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Accounts */}
          <Card className="flex flex-col min-h-0 relative overflow-hidden">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg lg:text-xl">Аккаунты</CardTitle>
              <CardDescription className="text-sm">Управление аккаунтами и их статусами</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow min-h-0 p-0">
              <div className="h-full max-h-[500px] overflow-y-auto p-4 lg:p-6">
                {loadingAccounts && !accounts && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}

                {accounts && (
                  <AccountsTable 
                    accounts={accounts} 
                    loading={loadingAccounts} 
                    showPagination={false}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
