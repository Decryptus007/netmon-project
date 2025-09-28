"use client";

import { useState } from "react";
import { Site } from "../../types/site";
import { Check, ChevronsUpDown, Building2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SiteDropdownProps {
  sites: Site[];
  selectedSite: Site | null;
  onSiteChange: (site: Site | null) => void;
}

export function SiteDropdown({ sites, selectedSite, onSiteChange }: SiteDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between bg-background hover:bg-accent/10 border-border text-foreground"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-foreground/70" />
            <span className="truncate font-medium">
              {selectedSite ? selectedSite.name : "All Sites"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-foreground/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 shadow-lg bg-background border-border" align="end">
        <Command>
          <div className="flex items-center border-b border-border px-3 bg-accent/5">
            <Search className="mr-2 h-4 w-4 shrink-0 text-foreground/70" />
            <CommandInput 
              placeholder="Search sites..." 
              className="h-9 bg-transparent text-foreground placeholder:text-foreground/50"
            />
          </div>
          <CommandEmpty className="py-6 text-center text-sm text-foreground/70">
            No sites found.
          </CommandEmpty>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                onSiteChange(null);
                setOpen(false);
              }}
              className="flex items-center gap-2 py-2 cursor-pointer hover:bg-accent/10 text-foreground"
            >
              <Building2 className="h-4 w-4 text-foreground/70" />
              <span className="font-medium">All Sites</span>
              <Check
                className={cn(
                  "ml-auto h-4 w-4 text-accent",
                  !selectedSite ? "opacity-100" : "opacity-0"
                )}
              />
            </CommandItem>
            {sites.map((site) => (
              <CommandItem
                key={site.id}
                onSelect={() => {
                  onSiteChange(site);
                  setOpen(false);
                }}
                className="flex items-center gap-2 py-2 cursor-pointer hover:bg-accent/10 text-foreground"
              >
                <Building2 className="h-4 w-4 text-foreground/70" />
                <span className="truncate font-medium">{site.name}</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4 text-accent",
                    selectedSite?.id === site.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 