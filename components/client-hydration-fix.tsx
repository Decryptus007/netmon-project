'use client'

import { useEffect } from 'react'

// This component suppresses hydration warnings caused by browser extensions
export default function ClientHydrationFix() {
  useEffect(() => {
    // This will run after hydration and suppress console errors about mismatches
    const originalError = console.error
    console.error = (...args) => {
      if (args[0]?.includes?.('Warning: Extra attributes from the server') && 
          args[0]?.includes?.('cz-shortcut-listen')) {
        return
      }
      originalError(...args)
    }
    
    return () => {
      console.error = originalError
    }
  }, [])
  
  return null
} 