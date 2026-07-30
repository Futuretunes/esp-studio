/**
 * Device dashboard populated by the matched Device Profile.
 */

import type { JSX } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MatchedDeviceProfile } from "@/features/profiles/types";
import { cn } from "@/lib/utils";

type DeviceDashboardProps = {
  readonly matched: MatchedDeviceProfile;
};

/**
 * Renders profile dashboard cards and primary actions.
 */
export function DeviceDashboard({ matched }: DeviceDashboardProps): JSX.Element {
  const { profile, isGeneric, context } = matched;
  const Icon = profile.icon;
  const cards = profile.dashboardCards(context);
  const actions = profile.deviceActions(context);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex items-start gap-3">
            <span className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="space-y-1">
              <CardTitle>Device Profile</CardTitle>
              <CardDescription>
                Profiles enhance the generic ESP tools — they never replace Flash,
                Filesystem, Serial, or Diagnostics.
              </CardDescription>
            </div>
          </div>
          <Badge variant={isGeneric ? "secondary" : "success"}>
            {isGeneric ? "Generic profile" : "Matched profile"}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">{profile.name}</p>
          {isGeneric ? (
            <p className="text-muted-foreground mt-1 text-xs">
              No firmware-specific profile matched. Showing Generic ESP Device.
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-xs">
              Matched from firmware metadata and/or recently used Firmware Library
              projects. Project-specific features may arrive later.
            </p>
          )}
        </CardContent>
      </Card>

      {cards.map((card) => (
        <Card key={card.id}>
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
            {card.description ? (
              <CardDescription>{card.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {card.fields.map((field) => (
                <div key={field.id}>
                  <dt className="text-muted-foreground text-xs">{field.label}</dt>
                  <dd className="text-sm font-medium">{field.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
          {card.actions && card.actions.length > 0 ? (
            <CardFooter className="flex flex-wrap gap-2">
              {card.actions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  size="sm"
                  variant={action.variant ?? "secondary"}
                  asChild
                >
                  <Link to={action.href}>{action.label}</Link>
                </Button>
              ))}
            </CardFooter>
          ) : null}
        </Card>
      ))}

      {actions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Opens existing ESP Studio tools — no duplicated workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("flex flex-wrap gap-2")}>
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant={action.variant ?? "secondary"}
                asChild
              >
                <Link to={action.href}>{action.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
