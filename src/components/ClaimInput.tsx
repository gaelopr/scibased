import {
  AlertCircle,
  ArrowRight,
  Check,
  ImageUp,
  Link2,
  ScanSearch,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";
import { useLanguage } from "../i18n";
import type { MockKey } from "../types";
import DemoSwitcher from "./DemoSwitcher";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CLAIM_LENGTH = 800;

interface ClaimInputProps {
  claimText: string;
  onClaimChange: (value: string) => void;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  onAnalyze: () => void;
  onDemo: (key: MockKey) => void;
  analysisError?: string | null;
}

export default function ClaimInput({
  claimText,
  onClaimChange,
  imageFile,
  onImageChange,
  onAnalyze,
  onDemo,
  analysisError,
}: ClaimInputProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const textareaId = useId();
  const errorId = useId();

  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canAnalyze = imageFile !== null || claimText.trim().length > 0;

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!fileError) return;
    const timeout = window.setTimeout(() => setFileError(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [fileError]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function validateAndSetFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError(t("claim.fileTypeError"));
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileError(t("claim.fileSizeError"));
      return;
    }

    setFileError(null);
    onImageChange(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
    // Allow selecting the same file again after removing or replacing it.
    event.target.value = "";
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pastedImage = Array.from(event.clipboardData.files).find((file) =>
      file.type.startsWith("image/"),
    );

    if (pastedImage) {
      event.preventDefault();
      validateAndSetFile(pastedImage);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const errorMessage = fileError ?? analysisError ?? null;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className="relative overflow-hidden rounded-[26px] bg-white text-ink-950 shadow-[0_35px_80px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink-950 text-white">
            <ScanSearch className="h-4 w-4" strokeWidth={2.1} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14.5px] font-semibold tracking-[-0.015em]">{t("claim.title")}</h2>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
              {t("claim.subtitle")}
            </p>
          </div>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600 sm:inline">
          {t("claim.free")}
        </span>
      </div>

      <div className="px-5 sm:px-6">
        {errorMessage && (
          <div
            id={errorId}
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[11.5px] leading-5 text-red-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
            {errorMessage}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        {imageFile ? (
          <div className="animate-fade-in rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-3">
              <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-slate-200 ring-1 ring-black/5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={t("claim.previewAlt")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="skeleton-light h-full w-full" />
                )}
                <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-ink-950" title={imageFile.name}>
                  {imageFile.name}
                </p>
                <p className="mt-0.5 text-[10.5px] text-slate-500">
                  {t("claim.ready")} · {formatBytes(imageFile.size)}
                </p>
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="mt-1.5 text-[10.5px] font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition hover:text-emerald-800"
                >
                  {t("claim.replace")}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onImageChange(null);
                  setFileError(null);
                }}
                aria-label={t("claim.remove")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            aria-describedby={errorMessage ? errorId : undefined}
            className={`group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-5 py-7 text-center transition duration-300 sm:py-8 ${
              isDragging
                ? "scale-[0.995] border-emerald-400 bg-emerald-50/80"
                : "border-slate-200 bg-slate-50/70 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 transition duration-300 ${
                isDragging
                  ? "scale-110 border-emerald-200 text-emerald-600"
                  : "group-hover:-translate-y-0.5 group-hover:text-emerald-600"
              }`}
            >
              <ImageUp className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span className="mt-3.5 text-[14px] font-semibold tracking-[-0.01em] text-ink-950">
              {isDragging ? t("claim.dragActive") : t("claim.drop")}
            </span>
            <span className="mt-1 text-[11.5px] leading-5 text-slate-500">
              {t("claim.or")}{" "}
              <span className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2">
                {t("claim.browse")}
              </span>
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.07em] text-slate-600">
              {t("claim.formats")}
            </span>
          </button>
        )}

        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-100" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
            {t("claim.orPaste")}
          </span>
          <span className="h-px flex-1 bg-slate-100" />
        </div>

        <div className="relative">
          <label htmlFor={textareaId} className="sr-only">
            {t("claim.textareaLabel")}
          </label>
          <textarea
            id={textareaId}
            autoComplete="off"
            value={claimText}
            onChange={(event) => onClaimChange(event.target.value.slice(0, MAX_CLAIM_LENGTH))}
            maxLength={MAX_CLAIM_LENGTH}
            rows={4}
            placeholder={t("claim.placeholder")}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canAnalyze) {
                event.preventDefault();
                onAnalyze();
              }
            }}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 px-4 pb-8 pt-3.5 text-[15px] leading-6 text-ink-950 placeholder:text-slate-500 transition duration-200 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
          <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[9.5px] tabular-nums text-slate-500">
            {claimText.length} / {MAX_CLAIM_LENGTH}
          </span>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`group mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[13.5px] font-semibold transition duration-300 ${
            canAnalyze
              ? "bg-ink-950 text-white shadow-[0_16px_30px_-16px_rgba(8,14,24,0.7)] hover:-translate-y-px hover:bg-slate-800 hover:shadow-[0_20px_34px_-16px_rgba(8,14,24,0.65)] active:translate-y-0"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
        >
          <Sparkles
            className={`h-4 w-4 transition ${canAnalyze ? "text-emerald-300" : "text-slate-400"}`}
            strokeWidth={2.1}
            aria-hidden="true"
          />
          {t("claim.cta")}
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-300 ${
              canAnalyze ? "group-hover:translate-x-1" : ""
            }`}
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </button>

        <div className="mt-3 flex items-center justify-between gap-3 px-0.5 text-[9.5px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            {t("claim.receipts")}
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Timer className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            {t("claim.time")}
          </span>
        </div>

        <p className="mb-4 mt-2 text-[9.5px] leading-4 text-slate-500">
          {t("claim.searchNote")}
        </p>
      </div>

      <div className="mt-5">
        <DemoSwitcher onSelect={onDemo} />
      </div>
    </div>
  );
}
