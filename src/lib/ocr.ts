import type { AnalysisProgress } from "../types";

interface OcrOptions {
  onProgress?: (progress: AnalysisProgress) => void;
}

/**
 * Read text from a screenshot locally in the browser with Tesseract.js.
 * The image never leaves the device. Only the extracted claim is sent to the
 * literature APIs later.
 */
export async function recognizeClaimFromImage(
  file: File,
  { onProgress }: OcrOptions = {},
): Promise<string> {
  const acceptedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!acceptedTypes.has(file.type)) {
    throw new Error("Please upload a PNG, JPEG, or WebP screenshot.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("That image is too large. Please use a screenshot under 10 MB.");
  }

  // Reject decompression bombs before passing the image to the OCR worker.
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const megapixels = (bitmap.width * bitmap.height) / 1_000_000;
      bitmap.close();
      if (megapixels > 40) {
        throw new Error(
          "That image is too large to read safely. Please use one under 40 megapixels.",
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("That image")) throw error;
      throw new Error("We couldn't open that image. Try a PNG, JPEG, or WebP screenshot.");
    }
  }

  report(onProgress, {
    step: "ocr",
    message: "Loading the on-device text reader",
    percent: 8,
  });

  const { createWorker } = await import("tesseract.js");

  // Keep the worker, WASM core, and English model on our own origin. This
  // avoids runtime third-party code and lets the Content-Security-Policy stay
  // strict (no CDN script or connect exceptions).
  const asset = (path: string) => new URL(path, document.baseURI).href;

  const worker = await createWorker("eng", 1, {
    workerPath: asset("ocr/worker.min.js"),
    corePath: asset("ocr/tesseract-core-lstm.wasm.js"),
    langPath: asset("ocr"),
    logger: (message: { status: string; progress: number }) => {
      const ratio = Number.isFinite(message.progress) ? message.progress : 0;
      const percent = 10 + Math.round(Math.min(1, Math.max(0, ratio)) * 75);

      const label =
        message.status === "recognizing text"
          ? "Reading the text in your screenshot"
          : message.status === "loading language traineddata"
            ? "Loading the English text model"
            : message.status === "initializing api"
              ? "Preparing the on-device reader"
              : "Reading your screenshot";

      report(onProgress, {
        step: "ocr",
        message: label,
        percent,
      });
    },
  });

  try {
    const result = await worker.recognize(file);
    const text = cleanOcrText(result.data.text);

    if (text.length < 8) {
      throw new Error(
        "We couldn't find a readable claim in that image. Try a clearer screenshot or paste the text.",
      );
    }

    report(onProgress, {
      step: "ocr",
      message: "Screenshot read — starting the literature search",
      percent: 100,
    });

    return text;
  } finally {
    await worker.terminate();
  }
}

function cleanOcrText(raw: string): string {
  const noise =
    /^(like|likes|comment|comments|share|save|follow|following|for you|fyp|explore|reels?|tiktok|instagram|threads|verified|sponsored|ad|read more|see more|view \d+|\d+[.,]?\d*[km]? (likes?|comments?|views?|shares?)|@[a-z0-9._]+|\d{1,2}:\d{2}(?:\s*[ap]m)?)$/i;

  const lines = raw
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\s+/g, " ")
        .replace(/[|¦]/g, "I")
        .trim(),
    )
    .filter((line) => line.length >= 4)
    .filter((line) => !noise.test(line))
    .filter((line) => !/^[\d\s.,:;!?()\-–—]+$/.test(line));

  const joined = lines.join(" ").replace(/\s+/g, " ").trim();
  if (!joined) return "";

  // Screenshots often include the caption plus UI chrome. Prefer the sentence
  // that looks most like a health claim, then include a little surrounding
  // context so the query still makes sense.
  const sentences = joined
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12);

  if (sentences.length === 0) return joined.slice(0, 700);

  const claimWords =
    /\b(cause|causes|cured?|cures?|treat|treats?|prevent|prevents?|boost|boosts?|improve|improves?|reduce|reduces?|safe|dangerous|toxic|risk|linked|connection|science|study|studies|research|evidence|doctor|health|sleep|kidney|gut|brain|heart|weight|diet|supplement|vitamin|protein|creatine|magnesium|water|sugar|fasting|exercise)\b/i;

  const scored = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score:
        (claimWords.test(sentence) ? 3 : 0) +
        Math.min(3, sentence.split(/\s+/).length / 8) +
        (/[%]|\b\d+\b/.test(sentence) ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = scored[0]?.sentence ?? sentences[0];
  return best.slice(0, 700);
}

function report(
  onProgress: OcrOptions["onProgress"],
  progress: AnalysisProgress,
): void {
  onProgress?.(progress);
}
