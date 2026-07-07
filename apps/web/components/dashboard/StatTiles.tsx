// External
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

// Shadcn UI
import { Card, CardContent } from '@/components/ui/card';

// Components + logic
import { Sparkline } from '@/components/dashboard/Sparkline';
import { cn } from '@/lib/utils';
import {
  DashboardStat,
  formatDelta,
  isDeltaPositiveOutcome,
} from '@/lib/dashboard';

interface StatTilesProps {
  stats: DashboardStat[];
}

export const StatTiles = ({ stats }: StatTilesProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {stats.map((stat) => {
      const isGood = isDeltaPositiveOutcome(stat);
      return (
        <Card key={stat.label}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums',
                  isGood
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600',
                )}
              >
                {stat.delta >= 0 ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {formatDelta(stat.delta)}
              </span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {stat.value}
              </p>
              <div className="h-10 w-24 text-primary/80">
                <Sparkline data={stat.trend} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{stat.hint}</p>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
