import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HomeScreen from "./components/HomeScreen";
import LoadingState from "./components/LoadingState";
import ResultsScreen from "./components/ResultsScreen";
import { MOCK_RESULTS } from "./data/mockResults";
import { useLanguage, verdictLabel } from "./i18n";
import { fetchScientificData } from "./lib/fetchScientificData";
import { recognizeClaimFromImage } from "./lib/ocr";
import { useTheme } from "./lib/useTheme";
import type { AnalysisProgress, MockKey, VerdictResult } from "./types";

type View = "home" | "loading" | "results";

export default function App() {
  const { language, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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
      document.title = `${verdictLabel(t, result.verdict)} · SciBased`;
      return;
    }

    document.title =
      view === "loading" ? t("app.loadingTitle") : t("app.homeTitle");
  }, [view, result, t]);

  async function runAnalysis(
    claimOverride?: string,
    imageOverride?: File | null,
  ) {
    const submittedImage =
      imageOverride === undefined ? imageFile : imageOverride;
    const submittedClaim = submittedImage
      ? ""
      : (claimOverride ?? claimText).trim();

    if (!submittedClaim && !submittedImage) return;

    const readFromScreenshot = Boolean(submittedImage);

    setAnalysisError(null);
    setPendingClaim(submittedClaim || t("app.readingScreenshot"));
    setPendingFromScreenshot(readFromScreenshot);
    setAnalysisProgress({
      step: readFromScreenshot ? "ocr" : "query",
      message: readFromScreenshot
        ? t("app.openingScreenshot")
        : t("app.preparingSearch"),
      percent: 4,
    });
    setView("loading");

    try {
      let inputClaim = submittedClaim;

      if (!inputClaim && submittedImage) {
        inputClaim = await recognizeClaimFromImage(submittedImage, {
          onProgress: setAnalysisProgress,
          language,
        });
        setClaimText(inputClaim);
        setPendingClaim(inputClaim);
      }

      if (!inputClaim) {
        throw new Error(t("app.noClaim"));
      }

      const data = await fetchScientificData(inputClaim, {
        onProgress: setAnalysisProgress,
        language,
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
        /screenshot|image|claim|reach|network|timed out|search|captura|imagen|afirmaci[oó]n|conexi[oó]n|literatura|b[uú]squeda|no pudimos/i.test(
          error.message,
        )
          ? error.message
          : t("app.genericError");

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
    <div className="relative min-h-screen overflow-x-clip bg-canvas text-ink-950">
      <div
        className="hero-glow pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px]"
        aria-hidden="true"
      />

      <Header
        onHome={handleLogoClick}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

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
