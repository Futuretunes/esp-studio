import type { JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BuiltInCatalogCategory } from "@/features/firmware/catalog";
import type { FirmwareLibraryCategoryFilter } from "@/features/library/search";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS: readonly {
  readonly id: FirmwareLibraryCategoryFilter;
  readonly label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "lighting", label: "Lighting" },
  { id: "home-automation", label: "Home automation" },
  { id: "mqtt", label: "MQTT" },
  { id: "firmware", label: "Firmware" },
];

/**
 * Human label for a built-in catalog category.
 */
export function formatFirmwareCategoryLabel(
  category: BuiltInCatalogCategory,
): string {
  switch (category) {
    case "lighting":
      return "Lighting";
    case "home-automation":
      return "Home automation";
    case "mqtt":
      return "MQTT";
    case "firmware":
      return "Firmware";
  }
}

type FirmwareCategoryFilterProps = {
  value: FirmwareLibraryCategoryFilter;
  onChange: (value: FirmwareLibraryCategoryFilter) => void;
  disabled?: boolean;
};

/**
 * Category filter chips for the Firmware Library.
 */
export function FirmwareCategoryFilter({
  value,
  onChange,
  disabled = false,
}: FirmwareCategoryFilterProps): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
      {CATEGORY_OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            disabled={disabled}
            className={cn(!selected && "bg-background")}
            onClick={() => {
              onChange(option.id);
            }}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

type FirmwareCategoryBadgeProps = {
  category: BuiltInCatalogCategory;
};

/**
 * Compact category badge for firmware cards.
 */
export function FirmwareCategoryBadge({
  category,
}: FirmwareCategoryBadgeProps): JSX.Element {
  return <Badge variant="secondary">{formatFirmwareCategoryLabel(category)}</Badge>;
}
