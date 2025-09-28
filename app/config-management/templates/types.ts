export type TemplateCategory = 'network' | 'security' | 'system' | 'monitoring' | 'custom'

export interface TemplateVariable {
  name: string
  description: string
  defaultValue?: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'enum'
  enumValues?: string[]
}

export interface Template {
  id: number
  name: string
  description: string
  deviceType: string
  category: TemplateCategory
  lastModified: string
  author: string
  config: string
  variables: TemplateVariable[]
} 