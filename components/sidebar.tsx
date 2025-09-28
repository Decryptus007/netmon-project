// components/sidebar.tsx
'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Home, 
  Server, 
  Map, 
  Bell, 
  FileText, 
  Settings, 
  File, 
  Activity, 
  Brain,
  Save,
  Terminal,
  GitBranch,
  History,
  PlaySquare,
  ChevronDown,
  ChevronRight,
  Cpu,
  Key,
  Database
} from "lucide-react"

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/devices", label: "Devices", icon: Server },
  { href: "/network-map", label: "Network Map", icon: Map },
  { 
    href: "/config-management", 
    label: "Configuration", 
    icon: Terminal,
    subItems: [
      { href: "/config-management/backup", label: "Backup & Restore", icon: Save },
      { href: "/config-management/automation", label: "Automation", icon: PlaySquare },
      { href: "/config-management/templates", label: "Templates", icon: GitBranch },
      { href: "/config-management/credentials", label: "Credentials", icon: Key },
      { href: "/config-management/history", label: "Change History", icon: History },
    ]
  },
  { href: "/brain", label: "Brain", icon: Brain },
  { href: "/aiops", label: "AIOps", icon: Cpu },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/logs", label: "Logs", icon: FileText },
  { href: "/visibility", label: "Visibility", icon: Activity },
  { href: "/reports", label: "Reports", icon: File },
]

const adminNavItems = [
  { href: "/data-management", label: "Data Management", icon: Database },
  { href: "/agents", label: "Agents", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    configuration: false
  })

  const NavLink = ({ item }: { item: typeof mainNavItems[0] }) => {
    if (item.subItems) {
      return (
        <Collapsible
          open={openSections[item.label.toLowerCase()]}
          onOpenChange={(isOpen) => 
            setOpenSections(prev => ({
              ...prev,
              [item.label.toLowerCase()]: isOpen
            }))
          }
        >
          <CollapsibleTrigger className="w-full">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors w-full
                ${pathname.startsWith(item.href)
                  ? "bg-white/10 text-white"
                  : "hover:bg-white/5 hover:text-white"
                }`}
            >
              <item.icon className="h-5 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {openSections[item.label.toLowerCase()] 
                ? <ChevronDown className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />
              }
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-6 mt-1 space-y-1">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-colors text-[0.7rem] ${
                    pathname === subItem.href
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <subItem.icon className="h-4 w-3" />
                  <span>{subItem.label}</span>
                </Link>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Link
        href={item.href}
        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
          pathname === item.href
            ? "bg-white/10 text-white"
            : "hover:bg-white/5 hover:text-white"
        }`}
      >
        <item.icon className="h-5 w-4" />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className="sidebar justify-between text-xs text-sidebar-foreground p-4">
      <nav className="mt-8 flex flex-col space-y-2">
        <div className="space-y-2">
          {mainNavItems.map((item) => (
            <div key={item.href}>
              <NavLink item={item} />
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="px-4 py-2 text-xs font-semibold text-white/50 uppercase">
            Management
          </div>
          {adminNavItems.map((item) => (
            <div key={item.href}>
              <NavLink item={item} />
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}
