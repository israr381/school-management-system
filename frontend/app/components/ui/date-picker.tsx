import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Label } from "~/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover"

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

type DatePickerProps = {
  id?: string
  name?: string
  label?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromYear?: number
  toYear?: number
}

function DatePicker({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  fromYear = new Date().getFullYear() - 10,
  toYear = new Date().getFullYear() + 1,
}: DatePickerProps) {
  const selected = parseIsoDate(value)
  const [open, setOpen] = React.useState(false)
  const inputId = id || name

  return (
    <div className="w-full">
      {label ? (
        <div className="mb-2 flex items-center">
          <Label htmlFor={inputId} className="block text-sm font-medium leading-5 text-text-main">
            {label}
          </Label>
        </div>
      ) : null}
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <Popover
        open={open}
        modal={false}
        onOpenChange={(nextOpen, eventDetails) => {
          if (
            !nextOpen &&
            eventDetails.reason === "outside-press" &&
            eventDetails.event.target instanceof Element &&
            eventDetails.event.target.closest("[data-slot='select-content'], [data-slot='select-trigger']")
          ) {
            eventDetails.cancel()
            return
          }
          setOpen(nextOpen)
        }}
      >
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              id={inputId}
              type="button"
              variant="outline"
              disabled={disabled}
              data-empty={!selected}
              className={cn(
                "h-12.5 w-full justify-between rounded-md border-border-main bg-input-bg px-4 py-0 text-sm font-normal text-text-main shadow-none dark:bg-input-bg dark:hover:bg-input-bg focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand data-[empty=true]:text-text-muted",
                className,
              )}
            />
          }
        >
          <span className="min-w-0 truncate">{selected ? format(selected, "PP") : placeholder}</span>
          <CalendarIcon className="size-4 shrink-0 text-icon-muted" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto overflow-visible p-0"
          sideOffset={6}
        >
          <div onPointerDown={(event) => event.stopPropagation()}>
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(date) => {
                if (!date) return
                onChange?.(toIsoDate(date))
                setOpen(false)
              }}
              captionLayout="dropdown"
              navLayout="after"
              startMonth={new Date(fromYear, 0)}
              endMonth={new Date(toYear, 11)}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { DatePicker, parseIsoDate, toIsoDate }
