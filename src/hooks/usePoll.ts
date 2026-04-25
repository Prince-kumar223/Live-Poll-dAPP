import { useEffect, useState } from "react";
import {
  normalizeResultsMap,
  readHasVoted,
  readOptions,
  readQuestion,
  readResults,
} from "../lib/contract";
import { normalizeAppError, type AppError } from "../lib/errors";

export type PollResult = {
  optionIndex: number;
  optionLabel: string;
  votes: number;
  percentage: number;
};

export function usePoll(address: string | null) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [results, setResults] = useState<PollResult[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  async function refetch() {
    setIsLoading(true);

    try {
      const [nextQuestion, nextOptions, rawResults] = await Promise.all([
        readQuestion(),
        readOptions(),
        readResults(),
      ]);

      const parsedOptions = Array.isArray(nextOptions)
        ? nextOptions.map((option) => String(option))
        : [];
      const tallies = normalizeResultsMap(rawResults, parsedOptions.length);
      const totalVotes = tallies.reduce((sum, item) => sum + item.votes, 0);

      setQuestion(String(nextQuestion));
      setOptions(parsedOptions);
      setResults(
        tallies.map((item) => ({
          optionIndex: item.optionIndex,
          optionLabel: parsedOptions[item.optionIndex] ?? `Option ${item.optionIndex + 1}`,
          votes: item.votes,
          percentage:
            totalVotes === 0 ? 0 : Math.round((item.votes / totalVotes) * 100),
        })),
      );

      if (address) {
        setHasVoted(await readHasVoted(address));
      } else {
        setHasVoted(false);
      }

      setError(null);
    } catch (pollError) {
      setError(normalizeAppError(pollError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refetch();
  }, [address]);

  return {
    question,
    options,
    results,
    hasVoted,
    isLoading,
    error,
    refetch,
  };
}
