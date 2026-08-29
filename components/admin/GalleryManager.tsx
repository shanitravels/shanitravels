"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { FiPlus, FiEdit2, FiTrash2, FiStar } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Select, Toggle, Button, LocalizedField } from "./form";
import { SingleImageField } from "./ImageManager";
import { EmptyState, Card } from "./parts";
import {
  createContent,
  updateContent,
  toggleContentFlag,
  deleteContent,
} from "@/lib/actions/content";
import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  type GalleryImageDoc,
  type GalleryCategory,
} from "@/lib/types";

type Img = { publicId: string; url: string; alt: string };
const emptyPair = { en: "", ur: "" };

interface Draft {
  image: Img | null;
  caption: { en: string; ur: string };
  category: GalleryCategory;
  featured: boolean;
  active: boolean;
  order: string;
}

const blank: Draft = {
  image: null,
  caption: emptyPair,
  category: "journeys",
  featured: false,
  active: true,
  order: "0",
};

export function GalleryManager({ initial }: { initial: GalleryImageDoc[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<GalleryImageDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<GalleryImageDoc | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(
    () => rows.filter((r) => filter === "all" || r.category === filter),
    [rows, filter]
  );

  const openNew = () => {
    setDraft(blank);
    setErrors({});
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (g: GalleryImageDoc) => {
    setDraft({
      image: g.image,
      caption: g.caption ?? emptyPair,
      category: g.category,
      featured: g.featured,
      active: g.active,
      order: String(g.order),
    });
    setErrors({});
    setEditing(g);
    setCreating(false);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = () => {
    const now = new Date().toISOString();
    start(async () => {
      setErrors({});
      const res = editing
        ? await updateContent("gallery", editing.id, draft)
        : await createContent("gallery", draft);
      if (res.ok) {
        const merged: GalleryImageDoc = {
          id: editing?.id ?? (res.data as { id: string }).id,
          // Safe: the schema rejects a null image, so `ok` implies one exists.
          image: draft.image as Img,
          caption: draft.caption,
          category: draft.category,
          featured: draft.featured,
          active: draft.active,
          order: Number(draft.order) || 0,
          createdAt: editing?.createdAt ?? now,
          updatedAt: now,
        };
        setRows((prev) =>
          editing ? prev.map((r) => (r.id === merged.id ? merged : r)) : [...prev, merged]
        );
        toast.success(res.message ?? "Saved");
        close();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  };

  const flip = (g: GalleryImageDoc, flag: "active" | "featured", value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === g.id ? { ...r, [flag]: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("gallery", g.id, flag, value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === g.id ? { ...r, [flag]: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteContent("gallery", target.id);
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== target.id));
        toast.success(res.message ?? "Deleted");
      } else toast.error(res.error);
      setToDelete(null);
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All categories</option>
          {GALLERY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {GALLERY_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} photo(s)</span>
        <Button className="ml-auto" onClick={openNew}>
          <FiPlus /> Add photo
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No photographs here"
          message="Upload the photographs that appear on the public gallery page."
          cta={
            <Button onClick={openNew}>
              <FiPlus /> Add photo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((g) => (
            <Card key={g.id} className="flex flex-col overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={g.image.url}
                  alt={g.image.alt || g.caption?.en || "Gallery photograph"}
                  fill
                  className="object-cover"
                  sizes="240px"
                />
                {g.featured && (
                  <span
                    title="Large tile in the mosaic"
                    className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-navy/80 text-white"
                  >
                    <FiStar className="h-3 w-3" />
                  </span>
                )}
                {!g.active && (
                  <span className="absolute right-2 top-2 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className="truncate text-xs font-medium text-slate-700">
                  {g.caption?.en || <span className="text-slate-400">No caption</span>}
                </p>
                <p className="text-[10px] text-slate-400">
                  {GALLERY_CATEGORY_LABELS[g.category]}
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                  <label
                    className="flex items-center gap-1.5 text-[11px] text-slate-500"
                    title="Show as a large tile"
                  >
                    <Toggle checked={g.featured} onChange={(v) => flip(g, "featured", v)} /> Large
                  </label>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => openEdit(g)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
                      title="Edit"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setToDelete(g)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        title={editing ? "Edit photograph" : "Add photograph"}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save} pending={pending}>
              {editing ? "Save" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Photograph"
            required
            hint="Landscape shots sit best in the mosaic. The alt text is what screen readers announce."
            error={errors.image}
          >
            <SingleImageField
              value={draft.image}
              onChange={(image) => setDraft({ ...draft, image })}
              subfolder="gallery"
            />
          </Field>
          <LocalizedField
            label="Caption"
            hint="Optional. Shown over the photograph on hover and under it in the lightbox."
            value={draft.caption}
            onChange={(caption) => setDraft({ ...draft, caption })}
            maxLength={200}
            error={errors.caption}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required error={errors.category}>
              <Select
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as GalleryCategory })
                }
              >
                {GALLERY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {GALLERY_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sort order" hint="Lower numbers come first." error={errors.order}>
              <TextInput
                type="number"
                value={draft.order}
                onChange={(e) => setDraft({ ...draft, order: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle
                checked={draft.featured}
                onChange={(v) => setDraft({ ...draft, featured: v })}
              />{" "}
              Large tile
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />{" "}
              Published
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete photograph?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={<>Remove this photograph from the gallery? This cannot be undone.</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
