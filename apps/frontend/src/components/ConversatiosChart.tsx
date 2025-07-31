"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface ConversationsChartProps {
  data: { [date: string]: number }
}

export default function ConversationsChart({ data }: ConversationsChartProps) {
  const chartData = Object.entries(data).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
    }),
    count,
    fullDate: date,
  }))

  return (
    <div className="space-y-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Дата</span>
                          <span className="font-bold text-muted-foreground">{data.fullDate}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Разговоры</span>
                          <span className="font-bold">{data.count}</span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">{Object.keys(data).length}</div>
          <div className="text-sm text-muted-foreground">Дней с данными</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">{Object.values(data).reduce((sum, count) => sum + count, 0)}</div>
          <div className="text-sm text-muted-foreground">Всего разговоров</div>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">
            {Math.round(Object.values(data).reduce((sum, count) => sum + count, 0) / Object.keys(data).length)}
          </div>
          <div className="text-sm text-muted-foreground">Среднее в день</div>
        </div>
      </div>
    </div>
  )
}
