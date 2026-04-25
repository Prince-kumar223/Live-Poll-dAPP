import {
  Account,
  Address,
  Contract,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "";
export const NETWORK = import.meta.env.VITE_NETWORK ?? "testnet";
export const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const HORIZON_URL =
  import.meta.env.VITE_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

export const NETWORK_PASSPHRASE =
  NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
const EXPLORER_NETWORK = NETWORK === "mainnet" ? "public" : "testnet";

export function getRpcServer() {
  return new rpc.Server(RPC_URL, {
    allowHttp: RPC_URL.startsWith("http://"),
  });
}

export function getHorizonServer() {
  return new Horizon.Server(HORIZON_URL);
}

function getDummySimulationAccount() {
  return new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );
}

function buildInvokeOperation(functionName: string, args: xdr.ScVal[]) {
  return Operation.invokeContractFunction({
    contract: CONTRACT_ID,
    function: functionName,
    args,
  });
}

function buildReadonlyTransaction(functionName: string, args: xdr.ScVal[] = []) {
  return new TransactionBuilder(getDummySimulationAccount(), {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(buildInvokeOperation(functionName, args))
    .setTimeout(30)
    .build();
}

export async function simulateContractCall<T>(
  functionName: string,
  args: xdr.ScVal[] = [],
): Promise<T> {
  if (!CONTRACT_ID) {
    throw new Error("Missing VITE_CONTRACT_ID");
  }

  const server = getRpcServer();
  const tx = buildReadonlyTransaction(functionName, args);
  const simulation: any = await server.simulateTransaction(tx);
  const result = simulation?.result?.retval ?? simulation?.results?.[0]?.xdr;

  if (!result) {
    throw new Error(`No simulation result returned for ${functionName}`);
  }

  return scValToNative(result) as T;
}

export async function buildVoteTransaction(address: string, optionIndex: number) {
  if (!CONTRACT_ID) {
    throw new Error("Missing VITE_CONTRACT_ID");
  }

  const horizon = getHorizonServer();
  const rpcServer = getRpcServer();
  const account = await horizon.loadAccount(address);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      buildInvokeOperation("vote", [
        new Address(address).toScVal(),
        xdr.ScVal.scvU32(optionIndex),
      ]),
    )
    .setTimeout(60)
    .build();

  return rpcServer.prepareTransaction(tx);
}

export async function submitSignedTransaction(signedXdr: string) {
  const server = getRpcServer();
  const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  return server.sendTransaction(transaction);
}

export async function waitForTransaction(txHash: string, maxAttempts = 40) {
  const server = getRpcServer();

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response: any = await server.getTransaction(txHash);

    if (response.status === "SUCCESS" || response.status === "FAILED") {
      return response;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1500));
  }

  throw new Error("Timed out while waiting for transaction confirmation.");
}

export async function getLatestLedgerSequence() {
  const server = getRpcServer();
  const latest: any = await server.getLatestLedger();
  return Number(latest.sequence ?? latest.id ?? 0);
}

export function normalizeResultsMap(
  raw: unknown,
  optionCount: number,
): Array<{ optionIndex: number; votes: number }> {
  const empty = Array.from({ length: optionCount }, (_, optionIndex) => ({
    optionIndex,
    votes: 0,
  }));

  if (raw instanceof Map) {
    empty.forEach((entry) => {
      entry.votes = Number(raw.get(entry.optionIndex) ?? 0);
    });
    return empty;
  }

  if (raw && typeof raw === "object") {
    empty.forEach((entry) => {
      const value = (raw as Record<string, unknown>)[String(entry.optionIndex)];
      entry.votes = Number(value ?? 0);
    });
  }

  return empty;
}

export function truncateAddress(value: string, start = 6, end = 4) {
  if (!value) {
    return "";
  }

  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function getExplorerTxUrl(txHash: string) {
  return `https://stellar.expert/explorer/${EXPLORER_NETWORK}/tx/${txHash}`;
}

export function getExplorerContractUrl(contractId: string) {
  return `https://stellar.expert/explorer/${EXPLORER_NETWORK}/contract/${contractId}`;
}

export async function readQuestion() {
  return simulateContractCall<string>("get_question");
}

export async function readOptions() {
  return simulateContractCall<string[]>("get_options");
}

export async function readResults() {
  return simulateContractCall<unknown>("get_results");
}

export async function readHasVoted(address: string) {
  return simulateContractCall<boolean>("has_voted", [new Address(address).toScVal()]);
}

export async function readFeedback() {
  return simulateContractCall<string[]>("fetch_feedback");
}

export async function buildSendFeedbackTransaction(
  address: string,
  feedbackMessage: string,
) {
  if (!CONTRACT_ID) {
    throw new Error("Missing VITE_CONTRACT_ID");
  }

  const horizon = getHorizonServer();
  const rpcServer = getRpcServer();
  const account = await horizon.loadAccount(address);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      buildInvokeOperation("send_feedback", [xdr.ScVal.scvString(feedbackMessage)]),
    )
    .setTimeout(60)
    .build();

  return rpcServer.prepareTransaction(tx);
}

export function getContractInstance() {
  if (!CONTRACT_ID) {
    return null;
  }

  return new Contract(CONTRACT_ID);
}
