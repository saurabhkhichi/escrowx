"use client";

import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Zap,
  Star,
  Users,
  Briefcase,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-800/50 bg-purple-900/30 px-4 py-1.5 text-sm text-purple-300 mb-8">
              <Zap className="h-4 w-4" />
              Built on Stellar Testnet
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-100 mb-6">
              The Future of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Freelancing
              </span>{" "}
              is Decentralized
            </h1>
            <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
              FreelanceHub is a decentralized marketplace with milestone-based
              escrow and on-chain reputation. Hire and get hired without
              intermediaries.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/jobs">
                <Button size="lg">
                  Browse Jobs
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" size="lg">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-zinc-100 mb-4">
          Why FreelanceHub?
        </h2>
        <p className="text-center text-zinc-500 mb-16 max-w-2xl mx-auto">
          A trustless platform where milestones ensure quality and escrow
          guarantees payment
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: "Milestone Escrow",
              description:
                "Break projects into milestones with on-chain tracking. Funds are released only when work is approved.",
            },
            {
              icon: Star,
              title: "On-Chain Reputation",
              description:
                "Build a transparent, immutable reputation. Ratings and completed jobs live on the Stellar blockchain.",
            },
            {
              icon: Lock,
              title: "Trustless Payments",
              description:
                "No middleman fees. Smart contracts handle the escrow, so both parties stay protected.",
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 mb-5">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, label: "Freelancers", value: "Join now" },
              { icon: Briefcase, label: "Jobs Posted", value: "On-chain" },
              { icon: Shield, label: "Escrow Protected", value: "100%" },
              { icon: Star, label: "Avg Rating", value: "⭐ 4.8" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-zinc-100">
                    {stat.value}
                  </p>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-12 text-center">
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            Ready to Start?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Connect your Stellar wallet and join the decentralized freelance
            revolution.
          </p>
          <Link href="/jobs">
            <Button size="lg">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
