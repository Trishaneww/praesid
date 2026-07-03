// Next.js
import { useState } from "react";

// Libs
import { toast } from "sonner";
import { OiicsSearchResponse } from "@praesid/shared";
import { searchOiicsCodes } from "@/lib/oiics";

export const useOiicsSearch = () => {
  const [narrative, setNarrative] = useState("");
  const [results, setResults] = useState<OiicsSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchCodes = async () => {
    if (!narrative.trim() || isSearching) return;
    setIsSearching(true);
    try {
      setResults(await searchOiicsCodes(narrative.trim()));
    } catch {
      toast.error("Search failed. Is the API running on port 3001?");
    } finally {
      setIsSearching(false);
    }
  };

  return { narrative, setNarrative, results, isSearching, searchCodes };
};
