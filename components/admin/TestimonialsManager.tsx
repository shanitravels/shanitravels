"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Select, Toggle, Button, LocalizedField } from "./form";
import { EmptyState, Card } from "./parts";
import {
  createContent,
  updateContent,
  toggleContentFlag,
  deleteContent,
} from "@/lib/actions/content";
import {
  CLIENT_SECTORS,
  CLIENT_SECTOR_LABELS,
  type TestimonialDoc,
  type ClientSector,
} from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";

const emptyPair: LocalizedString = { en: "", ur: "" };

interface Draft {
  organization: string;
  sector: ClientSector;
  quote: LocalizedString;
  year: string;
  featured: boolean;
  active: boolean;
  order: string;
}

const blank: Draft = {
  organization: "",
  sector: "un-donor",
  quote: emptyPair,
  year: "",
  featured: false,
  active: true,
  order: "0",
};

export function TestimonialsManager({ initial }: { initial: TestimonialDoc[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<TestimonialDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<TestimonialDoc | null>(null);
  const [pending, start] = useTransition();

  const openNew = () => {
    setDraft(blank);
    setErrors({});
    setCreating(true);
    setEditing(null);
  };
  const openEdit = (t: TestimonialDoc) => {
    setDraft({
      organization: t.organization,
      sector: t.sector,
      quote: t.quote ?? emptyPair,
      year: t.year ?? "",
      featured: t.featured,
      active: t.active,
      order: String(t.order),
    });
    setErrors({});
    setEditing(t);
    setCreating(false);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = () => {
    const payload = { ...draft };
    const now = new Date().toISOString();
    start(async () => {
      setErrors({});
      const res = editing
        ? await updateContent("testimonial", editing.id, payload)
        : await createContent("testimonial", payload);
      if (res.ok) {
        const merged: TestimonialDoc = {
          id: editing?.id ?? (res.data as { id: string }).id,
          organization: draft.organization,
          sector: draft.sector,
          quote: draft.quote,
          year: draft.year || null,
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

  const flip = (t: TestimonialDoc, flag: "active" | "featured", value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === t.id ? { ...r, [flag]: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("testimonial", t.id, flag, value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === t.id ? { ...r, [flag]: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteContent("testimonial", target.id);
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== target.id));
        toast.success(res.message ?? "Deleted");
      } else toast.error(res.error);
      setToDelete(null);
    });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <FiPlus /> Add testimonial
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No testimonials yet"
          message="Add short paraphrased quotes from appreciation letters."
          cta={<Button onClick={openNew}><FiPlus /> Add testimonial</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((t) => (
            <Card key={t.id} className="flex flex-col p-4">
              <blockquote className="text-sm italic text-slate-600">“{t.quote.en}”</blockquote>
              <blockquote className="mt-1 text-xs italic text-slate-500" lang="ur">
                {t.quote.ur ? `“${t.quote.ur}”` : <span className="text-amber-600">Urdu missing</span>}
              </blockquote>
              <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.organization}</p>
                  <p className="text-[11px] text-slate-400">
                    {CLIENT_SECTOR_LABELS[t.sector]}
                    {t.year ? ` · ${t.year}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <label className="mr-1 flex items-center gap-1 text-[11px] text-slate-500" title="Featured">
                    <Toggle checked={t.featured} onChange={(v) => flip(t, "featured", v)} />
                  </label>
                  <button onClick={() => openEdit(t)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setToDelete(t)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {!t.active && (
                <span className="mt-2 self-start rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                  Inactive
                </span>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        title={editing ? "Edit testimonial" : "Add testimonial"}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={save} pending={pending}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Organization" required error={errors.organization}>
            <TextInput value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} invalid={!!errors.organization} />
          </Field>
          <Field label="Sector" required error={errors.sector}>
            <Select value={draft.sector} onChange={(e) => setDraft({ ...draft, sector: e.target.value as ClientSector })}>
              {CLIENT_SECTORS.map((s) => (
                <option key={s} value={s}>{CLIENT_SECTOR_LABELS[s]}</option>
              ))}
            </Select>
          </Field>
          <LocalizedField
            label="Quote"
            required
            error={errors.quote}
            hint={`Short paraphrase, no verbatim letters. ${draft.quote.en.length}/400`}
            multiline
            maxLength={400}
            value={draft.quote}
            onChange={(quote) => setDraft({ ...draft, quote })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year" error={errors.year}>
              <TextInput value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} placeholder="2011" />
            </Field>
            <Field label="Sort order" error={errors.order}>
              <TextInput type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle checked={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} /> Active
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete testimonial?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={<>Remove the testimonial from <strong>{toDelete?.organization}</strong>?</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
