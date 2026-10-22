import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HomeScreen from "./components/HomeScreen";
import LoadingState from "./components/LoadingState";
import ResultsScreen from "./components/ResultsScreen";
import { MOCK_RESULTS } from "./data/mockResults";
import { fetchScientificData } from "./lib/fetchScientificData";
import { recognizeClaimFromImage } from "./lib/ocr";
import type { AnalysisProgress, MockKey, VerdictResult } from "./types";

type View = "home" | "loading" | "results";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [claimText, setClaimText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerdictResult | null>(null);
  const [pendingClaim, setPendingClaim] = useState("");
  const [pendingFromScreenshot, setPendingFromScreenshot] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    if (view === "results" && result) {
      document.title = `${result.label} · SciBased`;
      return;
    }

    document.title =
      view === "loading"
        ? "Checking the papers · SciBased"
        : "SciBased — Science-based receipts for your feed";
  }, [view, result]);

  async function runAnalysis(
    claimOverride?: string,
    imageOverride?: File | null,
  ) {
    const submittedClaim = (claimOverride ?? claimText).trim();
    const submittedImage =
      imageOverride === undefined ? imageFile : imageOverride;

    if (!submittedClaim && !submittedImage) return;

    const readFromScreenshot = Boolean(submittedImage) && submittedClaim.length === 0;

    setAnalysisError(null);
    setPendingClaim(submittedClaim || "Reading the claim from your screenshot…");
    setPendingFromScreenshot(readFromScreenshot);
    setAnalysisProgress({
      step: readFromScreenshot ? "ocr" : "query",
      message: readFromScreenshot
        ? "Opening your screenshot on this device"
        : "Preparing a focused literature search",
      percent: 4,
    });
    setView("loading");

    try {
      let inputClaim = submittedClaim;

      if (!inputClaim && submittedImage) {
        inputClaim = await recognizeClaimFromImage(submittedImage, {
          onProgress: setAnalysisProgress,
        });
        setClaimText(inputClaim);
        setPendingClaim(inputClaim);
      }

      if (!inputClaim) {
        throw new Error(
          "We couldn't read a claim from that input. Paste the claim text and try again.",
        );
      }

      const data = await fetchScientificData(inputClaim, {
        onProgress: setAnalysisProgress,
      });

      setClaimText(inputClaim);
      setResult({
        ...data,
        fromScreenshot: readFromScreenshot,
        isSample: false,
      });
      setView("results");
    } catch (error) {
      console.error("SciBased analysis failed:", error);
      const message =
        error instanceof Error &&
        /screenshot|image|claim|reach|network|timed out|search/i.test(error.message)
          ? error.message
          : "We couldn't complete that analysis. Please check your connection and try again.";

      setAnalysisError(message);
      setView("home");
    }
  }

  function runDemo(key: MockKey) {
    const sample = MOCK_RESULTS[key];

    setAnalysisError(null);
    setAnalysisProgress(null);
    setClaimText(sample.claim);
    setImageFile(null);
    setPendingClaim("");
    setPendingFromScreenshot(false);
    setResult({
      ...sample,
      isSample: true,
      fromScreenshot: false,
      isLive: false,
    });
    setView("results");
  }

  function resetToHome() {
    setView("home");
    setClaimText("");
    setImageFile(null);
    setResult(null);
    setPendingClaim("");
    setPendingFromScreenshot(false);
    setAnalysisProgress(null);
    setAnalysisError(null);
  }

  function handleLogoClick() {
    if (view === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    resetToHome();
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink-950">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="page-grid absolute inset-0" />
        <div className="absolute -top-52 left-1/2 h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-emerald-500/[0.10] blur-[140px]" />
        <div className="absolute right-[-180px] top-[34%] h-[440px] w-[440px] rounded-full bg-sky-400/[0.032] blur-[130px]" />
        <div className="absolute -bottom-40 left-[-120px] h-[360px] w-[520px] rounded-full bg-emerald-400/[0.028] blur-[120px]" />
      </div>

      <Header onHome={handleLogoClick} />

      <div key={view} className="animate-page relative z-10">
        {view === "home" && (
          <HomeScreen
            claimText={claimText}
            onClaimChange={(value) => {
              setClaimText(value);
              if (analysisError) setAnalysisError(null);
            }}
            imageFile={imageFile}
            onImageChange={(file) => {
              setImageFile(file);
              if (analysisError) setAnalysisError(null);
            }}
            onAnalyze={runAnalysis}
            onDemo={runDemo}
            analysisError={analysisError}
          />
        )}

        {view === "loading" && (
          <LoadingState
            claimText={pendingClaim}
            fromScreenshot={pendingFromScreenshot}
            progress={analysisProgress}
          />
        )}

        {view === "results" && result && (
          <ResultsScreen result={result} onReset={resetToHome} />
        )}
      </div>

      <Footer />
    </div>
  );
}
