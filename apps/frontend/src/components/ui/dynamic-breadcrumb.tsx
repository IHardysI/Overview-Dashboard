"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"

const breadcrumbTranslations: Record<string, string> = {
  "statistics": "Статистика",
  "dialogs": "Диалоги",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, array) => {
      const translatedSegment = breadcrumbTranslations[segment] || segment
      const href = "/" + array.slice(0, index + 1).join("/")
      const isLast = index === array.length - 1
      
      return {
        segment,
        translatedSegment,
        href,
        isLast,
      }
    })
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {segments.length > 0 && <BreadcrumbSeparator className="hidden md:block" />}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((item) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem className="hidden md:block">
              {item.isLast ? (
                <BreadcrumbPage>{item.translatedSegment}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  {item.translatedSegment}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator className="hidden md:block" />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 