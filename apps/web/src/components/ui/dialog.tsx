import * as DialogPrimitive from "@radix-ui/react-dialog"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const Dialog = DialogPrimitive.Root

export function DialogContent({ className, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="review-backdrop" />
      <DialogPrimitive.Content className={cn("session-review", className)} {...props} />
    </DialogPrimitive.Portal>
  )
}

export const DialogTitle = DialogPrimitive.Title
