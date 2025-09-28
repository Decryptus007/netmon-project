"use client"

// components/header.tsx
import Link from "next/link"
import { Bell, User, Menu } from "lucide-react"
import { SiteDropdown } from "@/app/components/SiteDropdown"
import { useTenant } from "@/app/contexts/TenantContext"

interface HeaderProps {
  toggleSidebar: () => void
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { tenant, site, sites, setSite } = useTenant();

  console.log('Header Debug:', { tenant, site, sites }); // Debug log

  return (
    <header className="flex items-center justify-between bg-secondary px-4 py-2 border-b border-border">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-iconHover rounded-md transition-colors text-foreground hover:text-sidebar-foreground"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/70">Site:</span>
          <SiteDropdown
            sites={sites || []}
            selectedSite={site}
            onSiteChange={setSite}
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/alerts" className="relative">
          <div className="p-1 hover:bg-iconHover rounded-md transition-colors text-foreground hover:text-sidebar-foreground">
            <Bell className="w-6 h-6" />
            {/* Optionally add an alert badge using your accent color */}
            <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full"></span>
          </div>
        </Link>
        <Link href="/profile">
          <div className="p-1 hover:bg-iconHover rounded-md transition-colors text-foreground hover:text-sidebar-foreground">
            <User className="w-6 h-6" />
          </div>
        </Link>
      </div>
    </header>
  )
}
