"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Briefcase,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useWallet } from "@/hooks/wallet";
import { useContract } from "@/hooks/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobCardSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { truncateAddress, formatXlm } from "@/lib/utils";
import { JOB_STATUS } from "@/types";

interface Job {
  id: number;
  client: string;
  freelancer: string;
  title: string;
  description: string;
  budget: string;
  status: string;
  milestone_count: number;
  created_at: number;
}

interface Milestone {
  job_id: number;
  index: number;
  title: string;
  amount: string;
  deliverable: string;
  status: string;
}

export function ContractPage() {
  const { address, isConnected } = useWallet();
  const {
    createJob,
    applyForJob,
    assignFreelancer,
    addMilestone,
    submitMilestone,
    approveMilestone,
    cancelJob,
    completeJob,
    leaveReview,
    getJob,
    getConfig,
  } = useContract();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<
    Record<number, Milestone[]>
  >({});

  // Create job form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [creatingJob, setCreatingJob] = useState(false);

  // Milestone form
  const [msTitle, setMsTitle] = useState("");
  const [msAmount, setMsAmount] = useState("");
  const [msJobId, setMsJobId] = useState<number | null>(null);

  // Submit milestone form
  const [submitMsIndex, setSubmitMsIndex] = useState<number | null>(null);
  const [submitMsUrl, setSubmitMsUrl] = useState("");
  const [submitMsJobId, setSubmitMsJobId] = useState<number | null>(null);

  // Review form
  const [reviewJobId, setReviewJobId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTarget, setReviewTarget] = useState("");

  const [loadingJobId, setLoadingJobId] = useState<number | null>(null);

  // Fetch job from contract
  const fetchJob = useCallback(
    async (jobId: number): Promise<Job | null> => {
      try {
        const result = (await getJob(jobId)) as unknown as Job;
        if (result && result.title) return result;
      } catch {
        // Job doesn't exist
      }
      return null;
    },
    [getJob]
  );

  // Load all jobs by scanning job_counter
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const config = (await getConfig()) as { job_counter: number };
      const count = config?.job_counter || 0;
      const fetched: Job[] = [];
      for (let i = 1; i <= count; i++) {
        const job = await fetchJob(i);
        if (job) fetched.push(job);
      }
      setJobs(fetched);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [getConfig, fetchJob]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!isConnected) return;
    loadJobs();
    const interval = setInterval(loadJobs, 15000);
    return () => clearInterval(interval);
  }, [isConnected, loadJobs]);

  const handleCreateJob = async () => {
    if (!newTitle || !newBudget) {
      toast({ title: "Please fill in all fields", variant: "error" });
      return;
    }
    setCreatingJob(true);
    try {
      await createJob(newTitle, newDesc, newBudget);
      toast({ title: "Job created successfully!", variant: "success" });
      setNewTitle("");
      setNewDesc("");
      setNewBudget("");
      setShowCreateJob(false);
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create job";
      toast({ title: msg, variant: "error" });
    } finally {
      setCreatingJob(false);
    }
  };

  const handleApply = async (jobId: number) => {
    setLoadingJobId(jobId);
    try {
      await applyForJob(jobId);
      toast({ title: "Application submitted!", variant: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply";
      toast({ title: msg, variant: "error" });
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleAssign = async (jobId: number, freelancer: string) => {
    setLoadingJobId(jobId);
    try {
      await assignFreelancer(jobId, freelancer);
      toast({ title: "Freelancer assigned!", variant: "success" });
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign";
      toast({ title: msg, variant: "error" });
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleAddMilestone = async () => {
    if (msJobId === null || !msTitle || !msAmount) return;
    setLoadingJobId(msJobId);
    try {
      await addMilestone(msJobId, msTitle, msAmount);
      toast({ title: "Milestone added!", variant: "success" });
      setMsTitle("");
      setMsAmount("");
      setMsJobId(null);
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add milestone";
      toast({ title: msg, variant: "error" });
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleSubmitMs = async () => {
    if (submitMsJobId === null || submitMsIndex === null || !submitMsUrl) return;
    setLoadingJobId(submitMsJobId);
    try {
      await submitMilestone(submitMsJobId, submitMsIndex, submitMsUrl);
      toast({ title: "Milestone submitted!", variant: "success" });
      setSubmitMsUrl("");
      setSubmitMsIndex(null);
      setSubmitMsJobId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      toast({ title: msg, variant: "error" });
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleApproveMs = async (jobId: number, index: number) => {
    setLoadingJobId(jobId);
    try {
      await approveMilestone(jobId, index);
      toast({ title: "Milestone approved!", variant: "success" });
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve";
      toast({ title: msg, variant: "error" });
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleCancel = async (jobId: number) => {
    setLoadingJobId(jobId);
    try {
      await cancelJob(jobId);
      toast({ title: "Job cancelled", variant: "info" });
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel";
      toast({ title: msg, variant: "error" });
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleComplete = async (jobId: number) => {
    setLoadingJobId(jobId);
    try {
      await completeJob(jobId);
      toast({ title: "Job completed!", variant: "success" });
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to complete";
      toast({ title: msg, variant: "error" });
    } finally {
      setLoadingJobId(null);
    }
  };

  const handleReview = async () => {
    if (!reviewJobId || !reviewTarget) return;
    try {
      await leaveReview(reviewTarget, reviewJobId, reviewRating, reviewComment);
      toast({ title: "Review submitted!", variant: "success" });
      setReviewJobId(null);
      setReviewComment("");
      setReviewTarget("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      toast({ title: msg, variant: "error" });
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "Open":
        return "info";
      case "InProgress":
        return "warning";
      case "Completed":
        return "success";
      case "Cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Briefcase className="h-16 w-16 text-zinc-700 mb-6" />
        <h2 className="text-xl font-semibold text-zinc-300 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-zinc-500 text-center max-w-md">
          Connect your Stellar wallet to browse and create freelance jobs on the
          decentralized marketplace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Jobs</h1>
          <p className="text-sm text-zinc-500">
            Browse and manage freelance jobs on the marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadJobs} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateJob(!showCreateJob)}>
            <Plus className="h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Create Job Form */}
      {showCreateJob && (
        <Card className="border-purple-600/50">
          <CardHeader>
            <CardTitle>Create New Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Job title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Job description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <Input
              placeholder="Budget (in micro-XLM, e.g. 10000000 = 10 XLM)"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateJob} disabled={creatingJob}>
                {creatingJob ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Job
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateJob(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job List */}
      {loading && jobs.length === 0 ? (
        <div className="space-y-4">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="h-12 w-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">No jobs yet. Create the first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-zinc-100">
                        {job.title}
                      </h3>
                      <Badge variant={statusVariant(job.status)}>
                        {JOB_STATUS[job.status] || job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Job #{job.id}
                      </span>
                      <span className="flex items-center gap-1">
                        💰 {formatXlm(job.budget)} XLM
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {job.milestone_count} milestones
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {truncateAddress(job.client)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {job.status === "Open" && job.client !== address && (
                      <Button
                        size="sm"
                        onClick={() => handleApply(job.id)}
                        disabled={loadingJobId === job.id}
                      >
                        {loadingJobId === job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    )}
                    {job.status === "Open" && job.client === address && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(job.id)}
                        disabled={loadingJobId === job.id}
                      >
                        Cancel
                      </Button>
                    )}
                    {job.status === "InProgress" && job.client === address && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setMsJobId(msJobId === job.id ? null : job.id)
                          }
                        >
                          <Plus className="h-4 w-4" /> Milestone
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleComplete(job.id)}
                          disabled={loadingJobId === job.id}
                        >
                          <CheckCircle className="h-4 w-4" /> Complete
                        </Button>
                      </>
                    )}
                    {job.status === "InProgress" &&
                      job.freelancer === address && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setExpandedJob(expandedJob === job.id ? null : job.id)
                          }
                        >
                          Milestones
                          {expandedJob === job.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    {(job.status === "Completed" || job.status === "Open") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setReviewJobId(reviewJobId === job.id ? null : job.id)
                        }
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>

                {/* Add Milestone form */}
                {msJobId === job.id && (
                  <div className="mt-4 p-4 rounded-lg border border-zinc-800 bg-zinc-800/30 space-y-3">
                    <Input
                      placeholder="Milestone title"
                      value={msTitle}
                      onChange={(e) => setMsTitle(e.target.value)}
                    />
                    <Input
                      placeholder="Amount (micro-XLM)"
                      type="number"
                      value={msAmount}
                      onChange={(e) => setMsAmount(e.target.value)}
                    />
                    <Button size="sm" onClick={handleAddMilestone}>
                      Add Milestone
                    </Button>
                  </div>
                )}

                {/* Freelancer: Submit Milestone */}
                {job.status === "InProgress" && job.freelancer === address && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-zinc-300">
                      Your Milestones:
                    </p>
                    {Array.from({ length: job.milestone_count }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-800/30"
                      >
                        <span className="text-sm text-zinc-400">#{i}</span>
                        {submitMsJobId === job.id && submitMsIndex === i ? (
                          <div className="flex gap-2 flex-1">
                            <Input
                              placeholder="Deliverable URL"
                              value={submitMsUrl}
                              onChange={(e) => setSubmitMsUrl(e.target.value)}
                              className="flex-1"
                            />
                            <Button size="sm" onClick={handleSubmitMs}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSubmitMsJobId(job.id);
                              setSubmitMsIndex(i);
                            }}
                          >
                            Submit Deliverable
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Review form */}
                {reviewJobId === job.id && (
                  <div className="mt-4 p-4 rounded-lg border border-zinc-800 bg-zinc-800/30 space-y-3">
                    <Input
                      placeholder="Reviewer address (who to review)"
                      value={reviewTarget}
                      onChange={(e) => setReviewTarget(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-400">Rating:</span>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r}
                          onClick={() => setReviewRating(r)}
                          className={`text-lg ${
                            r <= reviewRating ? "text-amber-400" : "text-zinc-600"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Review comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                    <Button size="sm" onClick={handleReview}>
                      Submit Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
