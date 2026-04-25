import { useState } from "react";
import {
  buildVoteTransaction,
  submitSignedTransaction,
  waitForTransaction,
} from "../lib/contract";
import { normalizeAppError, type AppError } from "../lib/errors";

type VoteStatus = "idle" | "pending" | "success" | "fail";

type UseVoteArgs = {
  address: string | null;
  signTransaction: (transactionXdr: string) => Promise<string>;
  onSuccess?: () => Promise<void> | void;
};

export function useVote({ address, signTransaction, onSuccess }: UseVoteArgs) {
  const [txStatus, setTxStatus] = useState<VoteStatus>("idle");
  const [error, setError] = useState<AppError | null>(null);
  const [txHash, setTxHash] = useState("");

  async function submitVote(optionIndex: number) {
    if (!address) {
      return;
    }

    setTxStatus("pending");
    setError(null);

    try {
      const preparedTransaction = await buildVoteTransaction(address, optionIndex);
      const signedTxXdr = await signTransaction(preparedTransaction.toXDR());
      const submission: any = await submitSignedTransaction(signedTxXdr);
      const hash = String(submission?.hash ?? "");

      setTxHash(hash);

      const finalStatus: any = await waitForTransaction(hash);
      if (finalStatus.status !== "SUCCESS") {
        throw new Error(
          finalStatus.errorResultXdr ??
            finalStatus.resultXdr ??
            "Transaction failed on Stellar RPC.",
        );
      }

      setTxStatus("success");
      await onSuccess?.();
    } catch (voteError) {
      setTxStatus("fail");
      const normalized = normalizeAppError(voteError);
      setError(normalized);
      throw normalized;
    }
  }

  function resetStatus() {
    setTxStatus("idle");
    setError(null);
  }

  return {
    txStatus,
    txHash,
    error,
    submitVote,
    resetStatus,
  };
}
