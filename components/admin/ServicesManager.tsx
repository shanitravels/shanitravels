"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
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
import { slugify } from "@/lib/format";
import {
  SERVICE_GROUPS,
  SERVICE_GROUP_LABELS,
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  type ServiceDoc,
  type ServiceGroup,
  type VehicleClass,
} from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";

/** An untranslated field starts as an empty pair, never a bare string. */
const emptyPair: LocalizedString = { en: "", ur: "" };

interface Draft {
  title: LocalizedString;
  slug: string;
  slugTouched: boolean;
  group: ServiceGroup;
  summary: LocalizedString;
  body: LocalizedString;
  image: { publicId: string; url: string; alt: string } | null;
  relatedVehicleClasses: VehicleClass[];
  active: boolean;
  order: string;
}

const blank: Draft = {
  title: emptyPair,
  slug: "",
  slugTouched: false,
  group: "individual",
  summary: emptyPair,
  body: emptyPair,
  image: null,
  relatedVehicleClasses: [],
  active: true,
  order: "0",
};

export function ServicesManager({ initial }: { initial: ServiceDoc[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<ServiceDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<ServiceDoc | null>(null);
  const [pending, start] = useTransition();

  // The slug follows the *English* title until the user edits the slug directly.
  // Slugs stay single and Latin — they are URL keys, not translated copy.
  const setTitle = (title: LocalizedString) =>
    setDraft((d) => ({ ...d, title, slug: d.slugTouched ? d.slug : slugify(title.en) }));

  const openNew = () => {
    setDraft(blank);
    setErrors({});
    setCreating(true);
    setEditing(null);
  };
  const openEdit = (s: ServiceDoc) => {
    setDraft({
      title: s.title ?? emptyPair,
      slug: s.slug,
      slugTouched: true,
      group: s.group,
      summary: s.summary ?? emptyPair,
      body: s.body ?? emptyPair,
      image: s.image ?? null,
      relatedVehicleClasses: s.relatedVehicleClasses ?? [],
      active: s.active,
      order: String(s.order),
    });
    setErrors({});
    setEditing(s);
    setCreating(false);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = () => {
    const payload = {
      title: draft.title,
      slug: draft.slug,
      group: draft.group,
      summary: draft.summary,
      body: draft.body,
      image: draft.image,
      relatedVehicleClasses: draft.relatedVehicleClasses,
      active: draft.active,
      order: draft.order,
    };
    const now = new Date().toISOString();
    start(async () => {
      setErrors({});
      const res = editing
        ? await updateContent("service", editing.id, payload)
        : await createContent("service", payload);
      if (res.ok) {
        const merged: ServiceDoc = {
          id: editing?.id ?? (res.data as { id: string }).id,
          title: draft.title,
          slug: draft.slug,
          group: draft.group,
          summary: draft.summary,
          body: draft.body,
          image: draft.image,
          relatedVehicleClasses: draft.relatedVehicleClasses,
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

  const flip = (s: ServiceDoc, value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === s.id ? { ...r, active: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("service", s.id, "active", value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === s.id ? { ...r, active: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteContent("service", target.id);
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
          <FiPlus /> Add service
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No services yet"
          message="Add the services you offer — airport transfers, corporate travel, tours, and more."
          cta={<Button onClick={openNew}><FiPlus /> Add service</Button>}
        />
      ) : (
        <div className="space-y-2">
          {rows.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{s.title.en}</p>
                <p className="truncate text-xs text-slate-400" lang="ur">
                  {s.title.ur || <span className="text-amber-600">Urdu missing</span>}
                </p>
                <p className="truncate text-xs text-slate-400">/{s.slug} · {s.summary.en}</p>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Toggle checked={s.active} onChange={(v) => flip(s, v)} /> Active
              </label>
              <button onClick={() => openEdit(s)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button onClick={() => setToDelete(s)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                <FiTrash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        title={editing ? `Edit ${editing.title.en}` : "Add service"}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={save} pending={pending}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <LocalizedField
            label="Title"
            required
            error={errors.title}
            value={draft.title}
            onChange={setTitle}
          />
          <Field label="Slug" required error={errors.slug} hint="Used in the service URL">
            <TextInput
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value, slugTouched: true })}
              invalid={!!errors.slug}
            />
          </Field>
          <Field label="Group" required error={errors.group} hint="Which audience section this appears under">
            <Select value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value as ServiceGroup })}>
              {SERVICE_GROUPS.map((g) => (
                <option key={g} value={g}>{SERVICE_GROUP_LABELS[g]}</option>
              ))}
            </Select>
          </Field>
          <LocalizedField
            label="Summary"
            required
            error={errors.summary}
            hint="One line shown on cards and teasers"
            multiline
            value={draft.summary}
            onChange={(summary) => setDraft({ ...draft, summary })}
          />
          <Field label="Related vehicle classes" hint="Vehicles of these classes appear on the service page">
            <div className="flex flex-wrap gap-2">
              {VEHICLE_CLASSES.map((c) => {
                const on = draft.relatedVehicleClasses.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        relatedVehicleClasses: on
                          ? draft.relatedVehicleClasses.filter((x) => x !== c)
                          : [...draft.relatedVehicleClasses, c],
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      on ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-slate-600 hover:border-navy/50"
                    }`}
                  >
                    {VEHICLE_CLASS_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </Field>
          <LocalizedField
            label="Body"
            error={errors.body}
            hint="Markdown: ## headings, - bullets, **bold**, [links](/self-drive or https://…)"
            multiline
            value={draft.body}
            onChange={(body) => setDraft({ ...draft, body })}
            controlClassName="min-h-[160px] text-xs"
          />
          <Field label="Image">
            <SingleImageField value={draft.image} onChange={(image) => setDraft({ ...draft, image })} subfolder="services" />
          </Field>
          <div className="flex items-center justify-between">
            <Field label="Sort order" error={errors.order} className="w-32">
              <TextInput type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} /> Active
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete service?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={<>Remove <strong>{toDelete?.title.en}</strong> from the services list?</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
