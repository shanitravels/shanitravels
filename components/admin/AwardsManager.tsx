"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { FiPlus, FiEdit2, FiTrash2, FiAward } from "react-icons/fi";
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
import { AWARD_CATEGORIES, AWARD_CATEGORY_LABELS, type AwardDoc, type AwardCategory } from "@/lib/types";

type Img = { publicId: string; url: string; alt: string };
const emptyPair = { en: "", ur: "" };

interface Draft {
  title: { en: string; ur: string };
  issuer: { en: string; ur: string };
  description: { en: string; ur: string };
  image: Img | null;
  awardedOn: string;
  category: AwardCategory;
  active: boolean;
  order: string;
}

const blank: Draft = {
  title: emptyPair,
  issuer: emptyPair,
  description: emptyPair,
  image: null,
  awardedOn: "",
  category: "industry-awards",
  active: true,
  order: "0",
};

export function AwardsManager({ initial }: { initial: AwardDoc[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<AwardDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<AwardDoc | null>(null);
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

  const openEdit = (a: AwardDoc) => {
    setDraft({
      title: a.title ?? emptyPair,
      issuer: a.issuer ?? emptyPair,
      description: a.description ?? emptyPair,
      image: a.image ?? null,
      awardedOn: a.awardedOn ?? "",
      category: a.category,
      active: a.active,
      order: String(a.order),
    });
    setErrors({});
    setEditing(a);
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
        ? await updateContent("award", editing.id, draft)
        : await createContent("award", draft);
      if (res.ok) {
        const merged: AwardDoc = {
          id: editing?.id ?? (res.data as { id: string }).id,
          title: draft.title,
          issuer: draft.issuer,
          description: draft.description,
          image: draft.image,
          awardedOn: draft.awardedOn || null,
          category: draft.category,
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

  const flip = (a: AwardDoc, value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === a.id ? { ...r, active: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("award", a.id, "active", value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === a.id ? { ...r, active: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteContent("award", target.id);
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
          {AWARD_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {AWARD_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} entry(s)</span>
        <Button className="ml-auto" onClick={openNew}>
          <FiPlus /> Add award
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          message="Add the awards, certificates and appreciation letters shown on the public awards page."
          cta={
            <Button onClick={openNew}>
              <FiPlus /> Add award
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="flex gap-3 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {a.image?.url ? (
                  <Image
                    src={a.image.url}
                    alt={a.image.alt || a.title.en}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-slate-300">
                    <FiAward className="h-7 w-7" />
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium text-slate-800">{a.title.en}</p>
                <p className="truncate text-xs text-slate-500">{a.issuer.en}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {AWARD_CATEGORY_LABELS[a.category]}
                  {a.awardedOn ? ` · ${a.awardedOn}` : ""}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Toggle checked={a.active} onChange={(v) => flip(a, v)} /> Published
                  </label>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => openEdit(a)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
                      title="Edit"
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setToDelete(a)}
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
        title={editing ? `Edit ${editing.title.en}` : "Add award"}
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
          <LocalizedField
            label="Title"
            required
            hint="Both English and Urdu are required on this page."
            value={draft.title}
            onChange={(title) => setDraft({ ...draft, title })}
            maxLength={160}
            error={errors.title}
          />
          <LocalizedField
            label="Awarded by"
            required
            hint="The organization that issued it — shown in red under the title. Both languages required."
            value={draft.issuer}
            onChange={(issuer) => setDraft({ ...draft, issuer })}
            maxLength={160}
            error={errors.issuer}
          />
          <LocalizedField
            label="Description"
            hint="Optional — but if you write one, fill in both languages."
            multiline
            value={draft.description}
            onChange={(description) => setDraft({ ...draft, description })}
            maxLength={1200}
            error={errors.description}
          />
          <Field
            label="Photograph"
            hint="The trophy, plaque or scanned certificate. Shown uncropped, so any aspect ratio is fine."
            error={errors.image}
          >
            <SingleImageField
              value={draft.image}
              onChange={(image) => setDraft({ ...draft, image })}
              subfolder="awards"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" required error={errors.category}>
              <Select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as AwardCategory })}
              >
                {AWARD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {AWARD_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date awarded" hint="Optional." error={errors.awardedOn}>
              <TextInput
                type="date"
                value={draft.awardedOn}
                onChange={(e) => setDraft({ ...draft, awardedOn: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order" hint="Lower numbers come first." error={errors.order}>
              <TextInput
                type="number"
                value={draft.order}
                onChange={(e) => setDraft({ ...draft, order: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />{" "}
              Published
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete award?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={
          <>
            Remove <strong>{toDelete?.title.en}</strong> from the awards page?
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
