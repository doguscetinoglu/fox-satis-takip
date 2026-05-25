'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

type Ctx = { open: boolean; toggle: () => void; close: () => void }
const SidebarCtx = createContext<Ctx>({ open: false, toggle: () => {}, close: () => {} })

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SidebarCtx.Provider value={{ open, toggle: () => setOpen(v => !v), close: () => setOpen(false) }}>
      {children}
    </SidebarCtx.Provider>
  )
}

export const useSidebar = () => useContext(SidebarCtx)
