import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const numberedCheckboxVariants = cva(
  "peer relative flex size-6 shrink-0 items-center justify-center rounded-sm border border-input text-sm font-medium transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      tone: {
        default:
          "aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        team:
          "aria-invalid:aria-checked:border-team data-checked:border-team data-checked:bg-team data-checked:text-team-foreground dark:data-checked:bg-team",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
)

interface NumberedCheckboxProps
  extends CheckboxPrimitive.Root.Props,
    VariantProps<typeof numberedCheckboxVariants> {
  orderNumber?: number
}

function NumberedCheckbox({
  className,
  orderNumber,
  tone = "default",
  ...props
}: NumberedCheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="numbered-checkbox"
      className={cn(numberedCheckboxVariants({ tone }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="numbered-checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        {orderNumber}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { NumberedCheckbox }
