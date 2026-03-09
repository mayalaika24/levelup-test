import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentPropsWithoutRef, type ElementType } from "react";
import { cn } from "@/lib/utils";

const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-3xl font-bold tracking-tight text-foreground sm:text-4xl",
      h2: "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground",
      h3: "scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
      h4: "scroll-m-20 text-lg font-semibold tracking-tight text-foreground",
      body: "text-sm leading-6 text-foreground",
      "body-sm": "text-sm text-foreground",
      muted: "text-sm text-muted-foreground",
      label: "text-sm font-medium text-foreground",
      caption: "text-xs text-muted-foreground",
      error: "text-xs text-destructive",
      success: "text-xs text-primary",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

const defaultElements = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
  "body-sm": "p",
  muted: "p",
  label: "label",
  caption: "p",
  error: "p",
  success: "p",
} as const satisfies Record<
  NonNullable<VariantProps<typeof typographyVariants>["variant"]>,
  ElementType
>;

type TypographyVariant = NonNullable<VariantProps<typeof typographyVariants>["variant"]>;

type TypographyProps<T extends ElementType> = {
  as?: T;
  variant?: TypographyVariant;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

function Typography<T extends ElementType = "p">({
  as,
  variant = "body",
  className,
  ...props
}: TypographyProps<T>) {
  const Component = (as ?? defaultElements[variant]) as ElementType;

  return <Component className={cn(typographyVariants({ variant }), className)} {...props} />;
}

export { Typography, typographyVariants };
