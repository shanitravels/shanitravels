"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { FiCopy, FiTrash2, FiSearch, FiRefreshCw } from "react-icons/fi";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState, Card } from "./parts";
import { browseMedia, deleteMediaAsset, findAssetUsage } from "@/lib/actions/media";
import type { CloudinaryAsset } from "@/lib/cloudinary";

export function MediaLibrary() {
  const toast = useToast();
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<CloudinaryAsset | null>(null);
  const [usage, setUsage] = useState<string[] | null>(null);
  const [pending, start] = useTransition();

  const load = (reset = false) => {
    setLoading(true);
    start(async () => {
      const res = await browseMedia(reset ? undefined : cursor ?? undefined);
      if (res.ok && res.data) {
        setConfigured(res.data.configured);
        setAssets((prev) => (reset ? res.data!.assets : [...prev, ...res.data!.assets]));
        setCursor(res.data.nextCursor);
      } else if (!res.ok) {
        toast.error(res.error);
      }
      setLoading(false);
    });
  };

  // Fetch the first page of assets from Cloudinary on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => assets.filter((a) => a.publicId.toLowerCase().includes(query.toLowerCase())),
    [assets, query]
  );

  const askDelete = (asset: CloudinaryAsset) => {
    setToDelete(asset);
    setUsage(null);
    findAssetUsage(asset.publicId).then((res) => {
      if (res.ok && res.data) setUsage(res.data.map((u) => `${u.where}: ${u.title}`));
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteMediaAsset(target.publicId);
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.publicId !== target.publicId));
        toast.success(res.message ?? "Deleted");
      } else toast.error(res.error);
      setToDelete(null);
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("URL copied"),
      () => toast.error("Couldn't copy")
    );
  };

  if (!configured) {
    return (
      <EmptyState
        title="Cloudinary not configured"
        message="Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to your environment to enable the media library and uploads."
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-sm focus:border-navy focus:outline-none"
          />
        </div>
        <button
          onClick={() => load(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState
          title="No media yet"
          message="Images uploaded from the vehicle, client, service and settings forms will appear here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((a) => (
            <Card key={a.publicId} className="group overflow-hidden">
              <div className="relative aspect-square bg-slate-100">
                <Image src={a.url} alt={a.publicId} fill className="object-contain" sizes="200px" />
              </div>
              <div className="p-2">
                <p className="truncate text-[11px] text-slate-500" title={a.publicId}>
                  {a.publicId.split("/").pop()}
                </p>
                <p className="text-[10px] text-slate-400">
                  {a.width}×{a.height} · {(a.bytes / 1024).toFixed(0)} KB
                </p>
                <div className="mt-1.5 flex gap-1">
                  <button
                    onClick={() => copyUrl(a.url)}
                    className="flex flex-1 items-center justify-center gap-1 rounded bg-slate-100 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
                  >
                    <FiCopy className="h-3 w-3" /> Copy
                  </button>
                  <button
                    onClick={() => askDelete(a)}
                    className="rounded bg-red-50 px-2 py-1 text-red-500 hover:bg-red-100"
                  >
                    <FiTrash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cursor && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => load(false)}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this asset?"
        destructive
        pending={pending}
        confirmLabel="Delete from Cloudinary"
        message={
          <>
            {usage === null ? (
              "Checking where this asset is used…"
            ) : usage.length > 0 ? (
              <>
                This asset is still used in: <strong>{usage.join(", ")}</strong>. Remove it there
                first — deletion is blocked.
              </>
            ) : (
              "This asset isn't referenced anywhere and can be safely deleted."
            )}
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
