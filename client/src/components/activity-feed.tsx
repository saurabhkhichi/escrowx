"use client";

import { useTransactionStore } from "@/stores/transactions";
import { useWallet } from "@/hooks/wallet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Briefcase,
  Star,
  Send,
  FileCheck,
  UserPlus,
  XCircle,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import { truncateAddress, timeAgo } from "@/lib/utils";

const eventIcons: Record<string, typeof Activity> = {
  "Job Created": Briefcase,
  "Application Submitted": UserPlus,
  "Freelancer Assigned": UserPlus,
  "Milestone Added": PlusCircle,
  "Milestone Submitted": Send,
  "Milestone Approved": CheckCircle2,
  "Job Cancelled": XCircle,
  "Job Completed": FileCheck,
  "Review Left": Star,
};

const eventColors: Record<string, string> = {
  "Job Created": "text-blue-400",
  "Application Submitted": "text-purple-400",
  "Freelancer Assigned": "text-amber-400",
  "Milestone Added": "text-indigo-400",
  "Milestone Submitted": "text-cyan-400",
  "Milestone Approved": "text-emerald-400",
  "Job Cancelled": "text-red-400",
  "Job Completed": "text-emerald-400",
  "Review Left": "text-amber-400",
};

export function ActivityFeed() {
  const { events } = useTransactionStore();
  const { address } = useWallet();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Activity Feed</h1>
        <p className="text-sm text-zinc-500">
          Real-time events from the marketplace
        </p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Activity className="h-12 w-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">No activity yet</p>
          <p className="text-sm text-zinc-600 mt-1">
            Events will appear here as they happen
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const Icon = eventIcons[event.type] || Activity;
            const color = eventColors[event.type] || "text-zinc-400";
            const isOwn = event.address === address;

            return (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 ${color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-zinc-200">
                          {event.type}
                        </span>
                        {isOwn && (
                          <Badge variant="info" className="text-[10px]">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">{event.action}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                        <span className="font-mono">
                          {truncateAddress(event.address)}
                        </span>
                        <span>{timeAgo(event.timestamp)}</span>
                        {event.jobId && (
                          <span>Job #{event.jobId}</span>
                        )}
                      </div>
                      {event.details && (
                        <p className="mt-1 text-xs text-zinc-500 font-mono break-all">
                          {event.details}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
