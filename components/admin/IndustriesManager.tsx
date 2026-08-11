"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Select, Toggle, Button, LocalizedField } from "./form";
import { SingleImageField } from "./ImageManager";
import { EmptyState, Card } from "./parts";
import { createContent, updateContent, toggleContentFlag, deleteContent } from "@/lib/actions/content";
import { slugify } from "@/lib/format";
import {
  CLIENT_SECTORS,
  CLIENT_SECTOR_LABELS,
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  type IndustryDoc,
  type Service,
  type VehicleClass,
} from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";

const emptyPair: LocalizedString = { en: "", ur: "" };

interface Draft {
  name: LocalizedString;
  slug: string;
  slugTouched: boolean;
  icon: string;
  heroImage: { publicId: string; url: string; alt: string } | null;
  summary: LocalizedString;
  body: LocalizedString;
  relatedServiceSlugs: string[];
  relatedVehicleClasses: VehicleClass[];
  testimonialSector: string;
  seoTitle: LocalizedString;
  seoDescription: LocalizedString;
  featured: boolean;
  active: boolean;
  order: string;
}

const blank: Draft = {
  name: emptyPair, slug: "", slugTouched: false, icon: "", heroImage: null, summary: emptyPair, body: emptyPair,
  relatedServiceSlugs: [], relatedVehicleClasses: [], testimonialSector: "",
  seoTitle: emptyPair, seoDescription: emptyPair, featured: false, active: true, order: "0",
};

const ICON_OPTIONS = ["plane", "landmark", "building", "flag", "hands", "globe", "oil", "signal", "hardhat", "bank", "school", "family"];

export function IndustriesManager({ initial, services }: { initial: IndustryDoc[]; services: Service[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<IndustryDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<IndustryDoc | null>(null);
  const [pending, start] = useTransition();

  // The slug follows the *English* name until the user edits the slug directly.
  // Slugs stay single and Latin — they are URL keys, not translated copy.
  const setName = (name: LocalizedString) =>
    setDraft((d) => ({ ...d, name, slug: d.slugTouched ? d.slug : slugify(name.en) }));

  const openNew = () => { setDraft(blank); setErrors({}); setCreating(true); setEditing(null); };
  const openEdit = (i: IndustryDoc) => {
    setDraft({
      name: i.name ?? emptyPair, slug: i.slug, slugTouched: true, icon: i.icon ?? "",
      heroImage: i.heroImage ?? null, summary: i.summary ?? emptyPair, body: i.body ?? emptyPair,
      relatedServiceSlugs: i.relatedServiceSlugs, relatedVehicleClasses: i.relatedVehicleClasses,
      testimonialSector: i.testimonialSector ?? "",
      seoTitle: i.seo?.title ?? emptyPair, seoDescription: i.seo?.description ?? emptyPair,
      featured: i.featured, active: i.active, order: String(i.order),
    });
    setErrors({}); setEditing(i); setCreating(false);
  };
  const close = () => { setCreating(false); setEditing(null); };

  const save = () => {
    const payload = {
      name: draft.name, slug: draft.slug, icon: draft.icon, heroImage: draft.heroImage,
      summary: draft.summary, body: draft.body,
      relatedServiceSlugs: draft.relatedServiceSlugs,
      relatedVehicleClasses: draft.relatedVehicleClasses,
      testimonialSector: draft.testimonialSector,
      seo: { title: draft.seoTitle, description: draft.seoDescription },
      featured: draft.featured, active: draft.active, order: draft.order,
    };
    const now = new Date().toISOString();
    start(async () => {
      setErrors({});
      const res = editing
        ? await updateContent("industry", editing.id, payload)
        : await createContent("industry", payload);
      if (res.ok) {
        const merged: IndustryDoc = {
          id: editing?.id ?? (res.data as { id: string }).id,
          name: draft.name, slug: draft.slug, icon: draft.icon || null,
          heroImage: draft.heroImage, summary: draft.summary, body: draft.body,
          relatedServiceSlugs: draft.relatedServiceSlugs,
          relatedVehicleClasses: draft.relatedVehicleClasses,
          testimonialSector: (draft.testimonialSector || null) as IndustryDoc["testimonialSector"],
          seo: { title: draft.seoTitle, description: draft.seoDescription },
          featured: draft.featured, active: draft.active, order: Number(draft.order) || 0,
          createdAt: editing?.createdAt ?? now, updatedAt: now,
        };
        setRows((prev) => (editing ? prev.map((r) => (r.id === merged.id ? merged : r)) : [...prev, merged]));
        toast.success(res.message ?? "Saved");
        close();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  };

  const flip = (i: IndustryDoc, value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === i.id ? { ...r, active: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("industry", i.id, "active", value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === i.id ? { ...r, active: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteContent("industry", target.id);
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
        <Button onClick={openNew}><FiPlus /> Add industry</Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No industries yet" message="Industry pages power the sector-specific SEO play." cta={<Button onClick={openNew}><FiPlus /> Add industry</Button>} />
      ) : (
        <div className="space-y-2">
          {rows.map((i) => (
            <Card key={i.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{i.name.en}</p>
                <p className="truncate text-xs text-slate-400" lang="ur">
                  {i.name.ur || <span className="text-amber-600">Urdu missing</span>}
                </p>
                <p className="truncate text-xs text-slate-400">/industries/{i.slug} · {i.summary.en}</p>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Toggle checked={i.active} onChange={(v) => flip(i, v)} /> Active
              </label>
              <button onClick={() => openEdit(i)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button onClick={() => setToDelete(i)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                <FiTrash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        title={editing ? `Edit ${editing.name.en}` : "Add industry"}
        onClose={close}
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={save} pending={pending}>{editing ? "Save" : "Create"}</Button></>}
      >
        <div className="space-y-4">
          <LocalizedField
            label="Name"
            required
            error={errors.name}
            value={draft.name}
            onChange={setName}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" required error={errors.slug}>
              <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value, slugTouched: true })} invalid={!!errors.slug} />
            </Field>
            <Field label="Icon" error={errors.icon}>
              <Select value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })}>
                <option value="">Default</option>
                {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </Select>
            </Field>
          </div>
          <LocalizedField
            label="Summary"
            required
            error={errors.summary}
            hint="1–2 sentences for the card"
            multiline
            value={draft.summary}
            onChange={(summary) => setDraft({ ...draft, summary })}
          />
          <LocalizedField
            label="Body"
            error={errors.body}
            hint="Markdown — the landing-page content (250–400 words)"
            multiline
            value={draft.body}
            onChange={(body) => setDraft({ ...draft, body })}
            controlClassName="min-h-[200px] text-xs"
          />
          <Field label="Hero image">
            <SingleImageField value={draft.heroImage} onChange={(heroImage) => setDraft({ ...draft, heroImage })} subfolder="industries" />
          </Field>
          <Field label="Related services" hint="Shown on the page and used for cross-links">
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const on = draft.relatedServiceSlugs.includes(s.slug);
                return (
                  <button key={s.id} type="button"
                    onClick={() => setDraft({ ...draft, relatedServiceSlugs: on ? draft.relatedServiceSlugs.filter((x) => x !== s.slug) : [...draft.relatedServiceSlugs, s.slug] })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-slate-600 hover:border-navy/50"}`}>
                    {s.title}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Related vehicle classes">
            <div className="flex flex-wrap gap-2">
              {VEHICLE_CLASSES.map((c) => {
                const on = draft.relatedVehicleClasses.includes(c);
                return (
                  <button key={c} type="button"
                    onClick={() => setDraft({ ...draft, relatedVehicleClasses: on ? draft.relatedVehicleClasses.filter((x) => x !== c) : [...draft.relatedVehicleClasses, c] })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-slate-600 hover:border-navy/50"}`}>
                    {VEHICLE_CLASS_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Testimonial sector" hint="Pulls sector-matched clients & quotes onto the page">
            <Select value={draft.testimonialSector} onChange={(e) => setDraft({ ...draft, testimonialSector: e.target.value })}>
              <option value="">None</option>
              {CLIENT_SECTORS.map((s) => <option key={s} value={s}>{CLIENT_SECTOR_LABELS[s]}</option>)}
            </Select>
          </Field>
          <LocalizedField
            label="SEO title"
            required
            error={errors["seo.title"]}
            value={draft.seoTitle}
            onChange={(seoTitle) => setDraft({ ...draft, seoTitle })}
          />
          <LocalizedField
            label="SEO description"
            required
            error={errors["seo.description"]}
            multiline
            value={draft.seoDescription}
            onChange={(seoDescription) => setDraft({ ...draft, seoDescription })}
          />
          <div className="flex items-center justify-between">
            <Field label="Sort order" className="w-28">
              <TextInput type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
            </Field>
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
        title="Delete industry page?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={<>Remove the <strong>{toDelete?.name.en}</strong> landing page? Its URL will 404.</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
