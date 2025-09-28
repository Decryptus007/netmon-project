"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash } from "lucide-react"
import { TemplateVariable } from "../types"

interface VariableEditorProps {
  variables: TemplateVariable[]
  onChange: (variables: TemplateVariable[]) => void
}

export function VariableEditor({ variables, onChange }: VariableEditorProps) {
  const addVariable = () => {
    onChange([...variables, {
      name: '',
      description: '',
      type: 'string',
      required: true
    }])
  }

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index))
  }

  const updateVariable = (index: number, updates: Partial<TemplateVariable>) => {
    onChange(variables.map((variable, i) => 
      i === index ? { ...variable, ...updates } : variable
    ))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Template Variables</Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariable}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variable
        </Button>
      </div>
      {variables.map((variable, index) => (
        <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-md">
          <div className="space-y-2">
            <Label>Variable Name</Label>
            <Input
              value={variable.name}
              onChange={(e) => updateVariable(index, { name: e.target.value })}
              placeholder="e.g., hostname"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={variable.type}
              onValueChange={(value) => updateVariable(index, { 
                type: value as TemplateVariable['type']
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="enum">Enum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Input
              value={variable.description}
              onChange={(e) => updateVariable(index, { description: e.target.value })}
              placeholder="Variable description"
            />
          </div>
          {variable.type === 'enum' && (
            <div className="col-span-2">
              <Label>Enum Values (comma-separated)</Label>
              <Input
                value={variable.enumValues?.join(', ') || ''}
                onChange={(e) => updateVariable(index, { 
                  enumValues: e.target.value.split(',').map(v => v.trim())
                })}
                placeholder="value1, value2, value3"
              />
            </div>
          )}
          <div className="col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={variable.required}
                onCheckedChange={(checked) => 
                  updateVariable(index, { required: checked as boolean })
                }
              />
              <Label>Required</Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeVariable(index)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
} 