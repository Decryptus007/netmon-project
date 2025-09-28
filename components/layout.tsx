"use client"

import { useState } from "react"
import Header from "./header"
import Sidebar from "./sidebar"
import { TenantProvider } from "@/app/contexts/TenantContext"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <TenantProvider>
      <div className="flex h-screen overflow-hidden">
        <aside 
          className={`
            fixed top-0 left-0 h-full
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'w-44' : '-translate-x-full sm:translate-x-0 w-0'}
            overflow-hidden
          `}
        >
          <Sidebar />
        </aside>
        <div className={`flex-1 flex flex-col ${isSidebarOpen ? 'ml-44' : 'ml-0'}`}>
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TenantProvider>
  )
} 