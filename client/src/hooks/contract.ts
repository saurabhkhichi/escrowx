"use client";

import { useCallback } from "react";
import {
  Contract,
  rpc,
  TransactionBuilder,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { useWallet } from "./wallet";
import { useTransactionStore } from "@/stores/transactions";
import {
  CONTRACT_ADDRESS,
  NETWORK_PASSPHRASE,
  RPC_URL,
} from "@/lib/stellar";
import type { ContractEvent } from "@/types";

let _server: rpc.Server | null = null;
function getServer() {
  if (!_server) _server = new rpc.Server(RPC_URL);
  return _server;
}

function toScValAddress(addr: string) {
  return new Address(addr).toScVal();
}

function toScValString(s: string) {
  return nativeToScVal(s, { type: "string" });
}

function toScValU32(n: number) {
  return nativeToScVal(n, { type: "u32" });
}

function toScValI128(n: bigint | number) {
  return nativeToScVal(n.toString(), { type: "i128" });
}

function toScValU64(n: bigint | number) {
  return nativeToScVal(n.toString(), { type: "u64" });
}

interface ContractMethodOpts {
  method: string;
  args?: xdr.ScVal[];
  signWith?: string;
}

export function useContract() {
  const { address, signTransaction } = useWallet();
  const { addTransaction, updateTransaction, addEvent } =
    useTransactionStore();

  const getContract = useCallback(() => new Contract(CONTRACT_ADDRESS), []);

  const callContract = useCallback(
    async ({
      method,
      args = [],
      signWith,
    }: ContractMethodOpts): Promise<unknown> => {
      const server = getServer();
      const contract = getContract();
      const sourceAccount = await getServer().getAccount(
        signWith || address || ""
      );

      const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const tx = txBuilder
        .addOperation(contract.call(method, ...args))
        .setTimeout(180)
        .build();

      const simulated = await getServer().simulateTransaction(tx);

      if (rpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      const assembledTx = await rpc.assembleTransaction(tx, simulated).build();

      const signedXdr = await signTransaction(
        assembledTx.toXDR()
      );

      const pendingTx = useTransactionStore.getState().transactions.find(
        (t) => t.status === "pending" && t.method === method
      );

      const txHash = assembledTx.hash().toString("hex");

      if (pendingTx) {
        updateTransaction(txHash, "pending");
      } else {
        addTransaction({
          hash: txHash,
          status: "pending",
          method,
          params: {},
          timestamp: Date.now(),
        });
      }

      const sendResult = await getServer().sendTransaction(assembledTx);

      if (sendResult.status === "ERROR") {
        updateTransaction(txHash, "failed", String(sendResult.errorResult));
        throw new Error(`Transaction failed: ${String(sendResult.errorResult)}`);
      }

      let getTxResult = await getServer().getTransaction(sendResult.hash);
      let attempts = 0;
      while (
        getTxResult.status !== "SUCCESS" &&
        getTxResult.status !== "FAILED" &&
        attempts < 30
      ) {
        await new Promise((r) => setTimeout(r, 2000));
        getTxResult = await getServer().getTransaction(sendResult.hash);
        attempts++;
      }

      if (getTxResult.status === "SUCCESS") {
        updateTransaction(sendResult.hash, "success");
        return getTxResult;
      } else {
        updateTransaction(sendResult.hash, "failed", "Transaction failed on-chain");
        throw new Error("Transaction failed on-chain");
      }
    },
    [address, signTransaction, addTransaction, updateTransaction]
  );

  const readContract = useCallback(
    async (method: string, args: xdr.ScVal[] = []): Promise<unknown> => {
      try {
        const contract = getContract();
        // Build a dummy transaction for simulation (read-only)
        const sourceAccount = await getServer().getAccount(
          address || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
        );
        const tx = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(contract.call(method, ...args))
          .setTimeout(30)
          .build();

        const result = await getServer().simulateTransaction(tx);
        if (rpc.Api.isSimulationError(result)) {
          throw new Error(`Simulation failed: ${result.error}`);
        }
        if (!result.result) {
          throw new Error("No result from simulation");
        }
        return scValToNative(result.result.retval);
      } catch (err) {
        console.error(`Read ${method} failed:`, err);
        throw err;
      }
    },
    [address]
  );

  const createJob = useCallback(
    async (title: string, description: string, budget: string) => {
      if (!address) throw new Error("Not connected");
      addTransaction({
        hash: "pending-" + Date.now(),
        status: "pending",
        method: "create_job",
        params: { title, description, budget },
        timestamp: Date.now(),
      });
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Job Created",
        timestamp: Date.now(),
        address,
        action: `Created job: ${title}`,
      });
      return callContract({
        method: "create_job",
        args: [
          toScValAddress(address),
          toScValString(title),
          toScValString(description),
          toScValI128(BigInt(budget)),
        ],
        signWith: address,
      });
    },
    [address, callContract, addTransaction, addEvent]
  );

  const applyForJob = useCallback(
    async (jobId: number) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Application Submitted",
        timestamp: Date.now(),
        address,
        action: `Applied for job #${jobId}`,
        jobId,
      });
      return callContract({
        method: "apply_for_job",
        args: [toScValAddress(address), toScValU64(jobId)],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const assignFreelancer = useCallback(
    async (jobId: number, freelancer: string) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Freelancer Assigned",
        timestamp: Date.now(),
        address,
        action: `Assigned freelancer to job #${jobId}`,
        jobId,
      });
      return callContract({
        method: "assign_freelancer",
        args: [
          toScValAddress(address),
          toScValU64(jobId),
          toScValAddress(freelancer),
        ],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const addMilestone = useCallback(
    async (jobId: number, title: string, amount: string) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Milestone Added",
        timestamp: Date.now(),
        address,
        action: `Added milestone "${title}" to job #${jobId}`,
        jobId,
      });
      return callContract({
        method: "add_milestone",
        args: [
          toScValAddress(address),
          toScValU64(jobId),
          toScValString(title),
          toScValI128(BigInt(amount)),
        ],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const submitMilestone = useCallback(
    async (jobId: number, index: number, deliverable: string) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Milestone Submitted",
        timestamp: Date.now(),
        address,
        action: `Submitted milestone #${index} for job #${jobId}`,
        jobId,
        details: deliverable,
      });
      return callContract({
        method: "submit_milestone",
        args: [
          toScValAddress(address),
          toScValU64(jobId),
          toScValU32(index),
          toScValString(deliverable),
        ],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const approveMilestone = useCallback(
    async (jobId: number, index: number) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Milestone Approved",
        timestamp: Date.now(),
        address,
        action: `Approved milestone #${index} for job #${jobId}`,
        jobId,
      });
      return callContract({
        method: "approve_milestone",
        args: [
          toScValAddress(address),
          toScValU64(jobId),
          toScValU32(index),
        ],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const cancelJob = useCallback(
    async (jobId: number) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Job Cancelled",
        timestamp: Date.now(),
        address,
        action: `Cancelled job #${jobId}`,
        jobId,
      });
      return callContract({
        method: "cancel_job",
        args: [toScValAddress(address), toScValU64(jobId)],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const completeJob = useCallback(
    async (jobId: number) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Job Completed",
        timestamp: Date.now(),
        address,
        action: `Marked job #${jobId} as completed`,
        jobId,
      });
      return callContract({
        method: "complete_job",
        args: [toScValAddress(address), toScValU64(jobId)],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const leaveReview = useCallback(
    async (
      reviewee: string,
      jobId: number,
      rating: number,
      comment: string
    ) => {
      if (!address) throw new Error("Not connected");
      addEvent({
        id: `evt-${Date.now()}`,
        type: "Review Left",
        timestamp: Date.now(),
        address,
        action: `Left ${rating}-star review for job #${jobId}`,
        jobId,
      });
      return callContract({
        method: "leave_review",
        args: [
          toScValAddress(address),
          toScValAddress(reviewee),
          toScValU64(jobId),
          toScValU32(rating),
          toScValString(comment),
        ],
        signWith: address,
      });
    },
    [address, callContract, addEvent]
  );

  const getJob = useCallback(
    async (jobId: number) => {
      return readContract("get_job", [toScValU64(jobId)]);
    },
    [readContract]
  );

  const getMilestone = useCallback(
    async (jobId: number, index: number) => {
      return readContract("get_milestone", [
        toScValU64(jobId),
        toScValU32(index),
      ]);
    },
    [readContract]
  );

  const getFreelancerStats = useCallback(
    async (freelancer: string) => {
      return readContract("get_freelancer_stats", [
        toScValAddress(freelancer),
      ]);
    },
    [readContract]
  );

  const getJobApplicants = useCallback(
    async (jobId: number) => {
      return readContract("get_job_applicants", [toScValU64(jobId)]);
    },
    [readContract]
  );

  const getConfig = useCallback(async () => {
    return readContract("get_config");
  }, [readContract]);

  return {
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
    getMilestone,
    getFreelancerStats,
    getJobApplicants,
    getConfig,
  };
}
