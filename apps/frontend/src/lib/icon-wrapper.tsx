import { forwardRef } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'
import NextLink, { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'

/**
 * Wrapper component for Lucide icons to fix React 19 compatibility issues
 */
export function createIconWrapper<T extends LucideIcon>(Icon: T) {
  const IconWrapper = forwardRef<SVGSVGElement, Omit<LucideProps, 'ref'>>((props, ref) => {
    // @ts-expect-error - This works with React 19 despite the type error
    return <Icon {...props} ref={ref} />
  })
  
  IconWrapper.displayName = Icon.displayName || 'IconWrapper'
  return IconWrapper
}

/**
 * Wrapper component for Next.js Link to fix React 19 compatibility issues
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>>((props, ref) => {
  return <NextLink {...props} ref={ref} />
})

Link.displayName = 'LinkWrapper' 