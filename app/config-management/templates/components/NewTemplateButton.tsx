"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, FileCode, Bot } from "lucide-react"
import { CreateTemplateDialog } from "./CreateTemplateDialog"
import { AiTemplateDialog } from "./AiTemplateDialog"

interface NewTemplateButtonProps {
  onTemplateCreate: (template: {
    name: string
    description: string
    deviceType: string
    config: string
    category: 'network' | 'security' | 'system' | 'monitoring' | 'custom'
    variables: { name: string; description: string; defaultValue?: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }[]
  }) => void
}

export function NewTemplateButton({ onTemplateCreate }: NewTemplateButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#5BB6B7] hover:bg-[#4CA5A6] text-white">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start"
        className="min-w-fit bg-white border shadow-sm"
        sideOffset={4}
      >
        <DropdownMenuItem className="px-2 py-1.5 focus:bg-[#5BB6B7] focus:text-white cursor-pointer bg-white">
          <CreateTemplateDialog onTemplateCreate={onTemplateCreate}>
            <div className="flex items-center whitespace-nowrap">
              <FileCode className="mr-2 h-4 w-4" />
              <span className="text-sm">Manual Template</span>
            </div>
          </CreateTemplateDialog>
        </DropdownMenuItem>
        <DropdownMenuItem className="px-2 py-1.5 focus:bg-[#5BB6B7] focus:text-white cursor-pointer bg-white">
          <AiTemplateDialog onTemplateCreate={onTemplateCreate}>
            <div className="flex items-center whitespace-nowrap">
              <Bot className="mr-2 h-4 w-4" />
              <span className="text-sm">AI Generated</span>
            </div>
          </AiTemplateDialog>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 