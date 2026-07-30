import { ArrowRight } from "lucide-react";
import type { JSX } from "react";
import { Link } from "react-router-dom";

import { NAV_ICONS } from "@/app/nav-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NavItem } from "@/types";

type DashboardCardProps = {
  item: NavItem;
};

export function DashboardCard({ item }: DashboardCardProps): JSX.Element {
  const Icon = NAV_ICONS[item.id];

  return (
    <Card className="group hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="bg-primary/15 text-primary mb-1 flex size-10 items-center justify-center rounded-lg">
          <Icon className="size-5" aria-hidden />
        </div>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
          <Link
            to={item.path}
            className="inline-flex items-center gap-1.5"
            aria-label={`Open ${item.title}`}
          >
            Open
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
