import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full h-14 rounded-2xl border border-gray-300 px-4 bg-white text-left",
          "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0C4B20] focus:border-transparent",
          !value && "text-gray-400",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[300px] overflow-hidden">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0C4B20]"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-[250px]">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                {emptyText}
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onValueChange(option.value)
                      setOpen(false)
                      setSearchQuery("")
                    }}
                    className={cn(
                      "flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors",
                      value === option.value && "bg-[#0C4B20]/10"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100 text-[#0C4B20]" : "opacity-0"
                      )}
                    />
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
