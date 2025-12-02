"use client";

import Image from "next/image";
import type {
  ChangeEvent,
  ComponentProps,
  FormEvent,
  SVGProps,
  SyntheticEvent,
} from "react";
import { useEffect, useId, useState } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import type { ErrorKey } from "@/lib/i18n";

type MediaKind = "image" | "video";

type MediaItem = {
  key: string;
  size: number;
  lastModified: string | null;
  kind: MediaKind;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  kind: MediaKind;
};

type UploadedPart = {
  PartNumber: number;
  ETag: string;
};

const PART_SIZE = 8 * 1024 * 1024; // 8MB chunks keep B2 happy

const UploadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path
      d="M12 16V4"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m7 9 5-5 5 5"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 20h14" strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

const DownloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path
      d="M12 4v12"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m7 11 5 5 5-5"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M5 20h14" strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path
      d="M6 7h12"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 7V5.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5V7"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 7v11a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5V7"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type VideoWithSpinnerProps = ComponentProps<"video"> & {
  wrapperClassName?: string;
  spinnerSize?: "sm" | "md" | "lg";
};

const spinnerSizeClasses: Record<
  NonNullable<VideoWithSpinnerProps["spinnerSize"]>,
  string
> = {
  sm: "h-6 w-6 border",
  md: "h-9 w-9 border-[3px]",
  lg: "h-12 w-12 border-[3px]",
};

const VideoWithSpinner = ({
  wrapperClassName = "",
  spinnerSize = "md",
  className = "",
  onLoadedData,
  onLoadedMetadata,
  onWaiting,
  onPlaying,
  onError,
  ...rest
}: VideoWithSpinnerProps) => {
  const [isBuffering, setIsBuffering] = useState(true);

  const stopBuffering = (
    event: SyntheticEvent<HTMLVideoElement>,
    callback?: (event: SyntheticEvent<HTMLVideoElement>) => void
  ) => {
    setIsBuffering(false);
    callback?.(event);
  };

  const startBuffering = (
    event: SyntheticEvent<HTMLVideoElement>,
    callback?: (event: SyntheticEvent<HTMLVideoElement>) => void
  ) => {
    setIsBuffering(true);
    callback?.(event);
  };

  return (
    <div className={`relative ${wrapperClassName}`} aria-busy={isBuffering}>
      {isBuffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
          <span
            className={`inline-flex animate-spin rounded-full border-zinc-400 border-t-transparent ${spinnerSizeClasses[spinnerSize]}`}
            aria-hidden="true"
          />
        </div>
      )}
      <video
        {...rest}
        className={`block ${className}`}
        onLoadedData={(event) => stopBuffering(event, onLoadedData)}
        onLoadedMetadata={(event) => stopBuffering(event, onLoadedMetadata)}
        onPlaying={(event) => stopBuffering(event, onPlaying)}
        onWaiting={(event) => startBuffering(event, onWaiting)}
        onError={(event) => stopBuffering(event, onError)}
      />
    </div>
  );
};

export default function Home() {
  const { translation: t } = useLanguage();
  const fileInputId = useId();
  const [images, setImages] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [downloadBlocked, setDownloadBlocked] = useState(false);

  const resolvedError = customError ?? (errorKey ? t.errors[errorKey] : null);

  const postJson = async <T,>(
    path: string,
    payload: Record<string, unknown>
  ): Promise<T> => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as T | null;
    if (!response.ok) {
      const message =
        data && typeof data === "object" && data !== null && "error" in data
          ? ((data as Record<string, string>).error ?? "Request failed.")
          : "Request failed.";
      throw new Error(message);
    }
    if (data === null) {
      throw new Error("Unexpected empty response from server.");
    }
    return data;
  };

  const uploadMediaFile = async (media: PendingImage) => {
    const { uploadId, key } = await postJson<{
      uploadId: string;
      key: string;
    }>("/api/upload/start", {
      fileName: media.file.name,
      contentType: media.file.type,
    });

    const parts: UploadedPart[] = [];
    let partNumber = 1;

    try {
      for (
        let offset = 0;
        offset < media.file.size;
        offset += PART_SIZE, partNumber++
      ) {
        const chunk = media.file.slice(
          offset,
          Math.min(offset + PART_SIZE, media.file.size)
        );

        const { url } = await postJson<{ url: string }>("/api/upload/url", {
          key,
          uploadId,
          partNumber,
        });

        const uploadResponse = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": media.file.type,
          },
          body: chunk,
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Failed to upload part ${partNumber} (${uploadResponse.status}).`
          );
        }

        const etag = uploadResponse.headers.get("ETag");
        if (!etag) {
          throw new Error("Upload failed: missing ETag header.");
        }

        parts.push({
          PartNumber: partNumber,
          ETag: etag.replace(/"/g, ""),
        });
      }

      await postJson<{ success: boolean }>("/api/upload/complete", {
        key,
        uploadId,
        parts,
      });
    } catch (error) {
      await postJson<{ success: boolean }>("/api/upload/abort", {
        key,
        uploadId,
      }).catch(() => undefined);
      throw error;
    }
  };

  const clearErrorState = () => {
    setErrorKey(null);
    setCustomError(null);
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/images");
      if (!response.ok) {
        throw new Error("Failed to load images.");
      }
      const data = await response.json();
      const received: MediaItem[] = (data.images ?? []).map(
        (item: MediaItem) => ({
          ...item,
          kind: item.kind === "video" ? "video" : "image",
        })
      );
      const downloadCapExceeded = Boolean(data.downloadBlocked);
      setImages(received);
      setDownloadBlocked(downloadCapExceeded);
    } catch (err: unknown) {
      console.error(err);
      setDownloadBlocked(false);
      setCustomError(null);
      setErrorKey("loadImages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadImages();
  }, []);

  useEffect(() => {
    return () => {
      for (const image of pendingImages) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, [pendingImages]);

  const clearPendingImages = () => {
    setPendingImages((previous) => {
      for (const image of previous) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return [];
    });
  };

  const removePendingImage = (imageId: string) => {
    setPendingImages((previous) => {
      const next = previous.filter((image) => image.id !== imageId);
      const removed = previous.find((image) => image.id === imageId);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    clearErrorState();
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      clearPendingImages();
      return;
    }

    const next: PendingImage[] = [];
    let hasInvalidFile = false;

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        hasInvalidFile = true;
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const id = `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      next.push({
        id,
        file,
        previewUrl,
        kind: isVideo ? "video" : "image",
      });
    }

    if (hasInvalidFile) {
      setCustomError(null);
      setErrorKey("invalidFile");
    }

    if (!next.length) {
      return;
    }

    setPendingImages((previous) => [...previous, ...next]);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearErrorState();

    const form = event.currentTarget;
    if (!pendingImages.length) {
      setErrorKey("uploadSelection");
      return;
    }

    try {
      setUploading(true);
      for (const media of pendingImages) {
        await uploadMediaFile(media);
      }
      form.reset();
      clearPendingImages();
      await loadImages();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && err.message) {
        setCustomError(err.message);
        setErrorKey(null);
      } else {
        setCustomError(null);
        setErrorKey("uploadFailed");
      }
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewMedia(null);
      }
    };
    if (previewMedia) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [previewMedia]);

  const encodeKey = (key: string) =>
    key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");


  const handleDownloadAll = () => {
    if (!images.length) return;
    for (const image of images) {
      const encodedKey = encodeKey(image.key);
      const link = document.createElement("a");
      link.href = `/api/image/${encodedKey}`;
      link.download = image.key.split("/").pop() ?? "image";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-zinc-50">{t.heroTitle}</h1>
          <p className="text-xs text-zinc-500">{t.heroSubtitle}</p>
        </div>

        <form
          onSubmit={handleUpload}
          className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_auto]"
        >
          <div>
            <input
              id={fileInputId}
              type="file"
              name="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="peer sr-only"
            />
            <label
              htmlFor={fileInputId}
              className="flex h-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-8 text-center text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-200">
                <UploadIcon className="h-6 w-6" />
              </span>
              <span className="mt-3 text-sm font-medium text-zinc-100">
                {t.uploadCardTitle}
              </span>
            </label>
          </div>
          <div className="flex flex-col items-stretch gap-2">
            {pendingImages.length > 0 ? (
              <>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading
                    ? t.uploadButton.uploading
                    : t.uploadButton.ready(pendingImages.length)}
                </button>
                <p className="text-center text-[11px] text-zinc-500">
                  {t.pendingStatus.ready(pendingImages.length)}
                </p>
              </>
            ) : (
              <p className="text-center text-sm text-zinc-500">
                {t.pendingStatus.none}
              </p>
            )}
          </div>
        </form>

        {resolvedError && (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {resolvedError}
          </p>
        )}
        {pendingImages.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-200">
                {t.readyTitle(pendingImages.length)}
              </p>
              <button
                type="button"
                onClick={clearPendingImages}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-zinc-100"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                {t.discardAll}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pendingImages.map((media) => (
                <figure
                  key={media.id}
                  className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                    {media.kind === "video" ? (
                      <VideoWithSpinner
                        wrapperClassName="h-full w-full"
                        className="h-full w-full object-cover"
                        src={media.previewUrl}
                        playsInline
                        muted
                        loop
                        autoPlay
                        spinnerSize="sm"
                      />
                    ) : (
                      <Image
                        src={media.previewUrl}
                        alt={media.file.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                      />
                    )}
                  </div>
                  {media.kind === "video" && (
                    <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-zinc-100 shadow">
                      ▶
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`${t.discardOne} ${media.file.name}`}
                    onClick={() => removePendingImage(media.id)}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-red-200 shadow-lg transition hover:bg-black/80"
                  >
                    <TrashIcon className="h-3 w-3" />
                    {t.discardOne}
                  </button>
                </figure>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-200">{t.galleryTitle}</h2>
          {loading && <span className="text-xs text-zinc-500">{t.loading}</span>}
        </div>
        {downloadBlocked && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {t.downloadBlockedNotice}
          </div>
        )}

        {!loading && images.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.empty}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {images.map((image) => {
                const encodedKey = encodeKey(image.key);

                const isVideo = image.kind === "video";

                return (
                  <article
                    key={image.key}
                    className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewMedia(image)}
                      className="group relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 focus:outline-none"
                    >
                      {isVideo ? (
                        <VideoWithSpinner
                          wrapperClassName="h-full w-full"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                          src={`/api/image/${encodedKey}`}
                          playsInline
                          preload="metadata"
                          muted
                          loop
                        />
                      ) : (
                        <Image
                          src={`/api/image/${encodedKey}`}
                          alt={image.key}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                        />
                      )}
                      {isVideo && (
                        <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-zinc-100 shadow">
                          ▶
                        </span>
                      )}
                    </button>
                    <div className="flex items-center justify-end gap-2 border-t border-zinc-800 bg-zinc-950/60 px-3 py-2">
                      <a
                        href={`/api/image/${encodedKey}`}
                        download
                        className={`inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[11px] font-medium text-zinc-100 transition hover:bg-zinc-800 ${
                          downloadBlocked ? "pointer-events-none opacity-40" : ""
                        }`}
                        aria-label={`${t.download} ${image.key}`}
                        aria-disabled={downloadBlocked}
                        tabIndex={downloadBlocked ? -1 : undefined}
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                        {t.download}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={loading || images.length === 0 || downloadBlocked}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <DownloadIcon className="h-4 w-4" />
                {t.downloadAll}
              </button>
            </div>
          </>
        )}
      </section>

      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewMedia(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-800 bg-black/70 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-black/70 px-3 py-1.5 text-sm font-semibold text-zinc-100 transition hover:bg-black/90"
            >
              {t.previewClose}
            </button>
            <div className="relative h-full w-full">
              {previewMedia.kind === "video" ? (
                <VideoWithSpinner
                  wrapperClassName="max-h-[75vh] w-full rounded-3xl overflow-hidden"
                  className="max-h-[75vh] w-full object-contain"
                  src={`/api/image/${encodeKey(previewMedia.key)}`}
                  controls
                  autoPlay
                  playsInline
                  spinnerSize="lg"
                />
              ) : (
                <div className="relative mx-auto h-[75vh] w-full">
                  <Image
                    src={`/api/image/${encodeKey(previewMedia.key)}`}
                    alt={previewMedia.key}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    unoptimized
                    priority
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


