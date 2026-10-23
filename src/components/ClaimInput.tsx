import {
  AlertCircle,
  ArrowRight,
  Check,
  ImageUp,
  Link2,
  ScanSearch,
  Search,
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
      className={`relative overflow-hidden rounded-3xl border bg-surface text-ink-950 shadow-lift transition duration-200 ${
        isDragging ? "border-brand-strong ring-4 ring-brand-strong/10" : "border-line"
      }`}
    >
      {isDragging && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand-strong bg-brand-soft/95 text-center"
          aria-hidden="true"
        >
          <ImageUp className="h-7 w-7 text-brand" strokeWidth={1.8} />
          <p className="text-[14px] font-semibold text-brand-deep">{t("claim.dragActive")}</p>
          <p className="text-[11.5px] text-brand/80">{t("claim.formats")}</p>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand ring-1 ring-brand-line">
              <ScanSearch className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink-950">
                {t("claim.title")}
              </h2>
              <p className="mt-0.5 text-[12px] leading-5 text-subtle">
                {t("claim.subtitle")}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
            {t("claim.free")}
          </span>
        </div>

        {errorMessage && (
          <div
            id={errorId}
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-debunked-line bg-debunked-soft px-3 py-2.5 text-[12px] leading-5 text-debunked-text"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
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
          <div className="mt-4">
            <p className="text-[12px] font-medium text-muted">{t("claim.inputLabel")}</p>
            <div className="mt-2 animate-fade-in rounded-2xl border border-line bg-field p-3.5">
              <div className="flex items-center gap-3">
                <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-chip-strong ring-1 ring-line">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={t("claim.previewAlt")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-chip-strong" />
                  )}
                  <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-strong text-on-strong ring-2 ring-white">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink-950" title={imageFile.name}>
                    {imageFile.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-subtle">
                    {t("claim.imageReady")} · {formatBytes(imageFile.size)}
                  </p>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="mt-1.5 text-[11px] font-semibold text-brand underline decoration-brand-line underline-offset-2 transition hover:text-brand-deep"
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-subtle transition hover:border-line-strong hover:text-ink-800"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label
              htmlFor={textareaId}
              className="text-[12px] font-medium text-muted"
            >
              {t("claim.inputLabel")}
            </label>
            <div className="relative mt-2">
              <textarea
                id={textareaId}
                autoComplete="off"
                value={claimText}
                onChange={(event) => onClaimChange(event.target.value.slice(0, MAX_CLAIM_LENGTH))}
                maxLength={MAX_CLAIM_LENGTH}
                rows={4}
                placeholder={t("claim.placeholder")}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canAnalyze) {
                    event.preventDefault();
                    onAnalyze();
                  }
                }}
                className="w-full resize-none rounded-2xl border border-line bg-field px-4 pb-8 pt-3.5 text-[15px] leading-6 text-ink-950 placeholder:text-faint transition duration-200 focus:border-brand-strong focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-strong/10"
              />
              <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-[10px] tabular-nums text-faint">
                {claimText.length} / {MAX_CLAIM_LENGTH}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-2">
              <button
                type="button"
                onClick={openFilePicker}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-muted transition hover:border-line-strong hover:bg-surface-muted hover:text-ink-950"
              >
                <ImageUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                {t("claim.addScreenshot")}
              </button>
              <span className="text-[10.5px] text-faint">{t("claim.formats")}</span>
              <span className="ml-auto hidden text-[10.5px] text-faint sm:inline">
                {t("claim.dragHint")}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`group mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold transition duration-200 ${
            canAnalyze
              ? "bg-strong text-on-strong shadow-sm hover:-translate-y-px hover:bg-strong-hover hover:shadow-md active:translate-y-0"
              : "cursor-not-allowed bg-chip text-faint"
          }`}
        >
          <Search
            className={`h-4 w-4 ${canAnalyze ? "text-on-strong-accent" : "text-faint"}`}
            strokeWidth={2.2}
            aria-hidden="true"
          />
          {imageFile ? t("claim.ctaImage") : t("claim.cta")}
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-200 ${
              canAnalyze ? "group-hover:translate-x-0.5" : ""
            }`}
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[10.5px] text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {t("claim.receipts")}
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Timer className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {t("claim.time")}
          </span>
        </div>

        <p className="mt-2 text-[10.5px] leading-4 text-faint">
          {t("claim.searchNote")}
        </p>
      </div>

      <DemoSwitcher onSelect={onDemo} />
    </div>
  );
}
