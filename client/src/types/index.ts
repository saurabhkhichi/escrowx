export interface Job {
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

export interface Milestone {
  job_id: number;
  index: number;
  title: string;
  amount: string;
  deliverable: string;
  status: string;
}

export interface FreelancerStats {
  completed_jobs: number;
  total_earned: string;
  rating_sum: number;
  rating_count: number;
}

export interface Config {
  admin: string;
  job_counter: number;
}

export interface WalletInfo {
  address: string;
  name: string;
  icon: string;
}

export type TransactionStatus = "pending" | "success" | "failed";

export interface TransactionRecord {
  hash: string;
  status: TransactionStatus;
  method: string;
  params: Record<string, string>;
  timestamp: number;
  error?: string;
}

export interface ContractEvent {
  id: string;
  type: string;
  timestamp: number;
  address: string;
  action: string;
  jobId?: number;
  details?: string;
}

export interface ContractState {
  jobId: string;
  status: string;
  client: string;
  freelancer: string;
  budget: string;
  title: string;
  milestoneCount: number;
}

export const JOB_STATUS: Record<string, string> = {
  Open: "Open",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export const MS_STATUS: Record<string, string> = {
  Pending: "Pending",
  Submitted: "Submitted",
  Approved: "Approved",
};
