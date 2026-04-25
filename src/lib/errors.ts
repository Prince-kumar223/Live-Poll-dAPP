export type AppErrorCode =
  | "wallet_not_found"
  | "user_rejected"
  | "insufficient_balance"
  | "already_voted"
  | "unknown";

export class AppError extends Error {
  code: AppErrorCode;
  details?: string;

  constructor(code: AppErrorCode, message: string, details?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export class WalletNotFoundError extends AppError {
  constructor(details?: string) {
    super(
      "wallet_not_found",
      "No Stellar wallet found. Please install Freighter or xBull.",
      details,
    );
    this.name = "WalletNotFoundError";
  }
}

export class UserRejectedError extends AppError {
  constructor(details?: string) {
    super(
      "user_rejected",
      "Transaction was rejected. You cancelled the signing.",
      details,
    );
    this.name = "UserRejectedError";
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(details?: string) {
    super(
      "insufficient_balance",
      "Transaction failed: insufficient XLM balance.",
      details,
    );
    this.name = "InsufficientBalanceError";
  }
}

export class AlreadyVotedError extends AppError {
  constructor(details?: string) {
    super("already_voted", "You have already voted.", details);
    this.name = "AlreadyVotedError";
  }
}

function stringifyUnknown(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function normalizeAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const raw = stringifyUnknown(error);
  const lower = raw.toLowerCase();

  if (
    lower.includes("no wallet") ||
    lower.includes("wallet not found") ||
    lower.includes("no matching wallet") ||
    lower.includes("extension not found") ||
    lower.includes("empty modules")
  ) {
    return new WalletNotFoundError(raw);
  }

  if (
    lower.includes("user declined") ||
    lower.includes("user rejected") ||
    lower.includes("rejected by user") ||
    lower.includes("cancelled") ||
    lower.includes("canceled") ||
    lower.includes("code -4")
  ) {
    return new UserRejectedError(raw);
  }

  if (
    lower.includes("alreadyvoted") ||
    lower.includes("already voted") ||
    lower.includes("contracterror(2)") ||
    lower.includes("error(2)") ||
    lower.includes("tx_bad_auth_extra")
  ) {
    return new AlreadyVotedError(raw);
  }

  if (
    lower.includes("insufficient balance") ||
    lower.includes("op_underfunded") ||
    lower.includes("tx_insufficient_balance") ||
    lower.includes("insufficient xlm")
  ) {
    return new InsufficientBalanceError(raw);
  }

  return new AppError("unknown", "Something went wrong while talking to Stellar.", raw);
}
