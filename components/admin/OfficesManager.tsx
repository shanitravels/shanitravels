"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiPhone } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Toggle, Button, LocalizedField } from "./form";
import { EmptyState, Card } from "./parts";
import {
  createContent,
  updateContent,
  toggleContentFlag,
  deleteContent,
} from "@/lib/actions/content";
import type { OfficeDoc } from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";

const emptyPair: LocalizedString = { en: "", ur: "" };

interface Draft {
  city: LocalizedString;
  address: LocalizedString;
  phones: string;
  email: string;
  mapUrl: string;
  isHeadOffice: boolean;
  active: boolean;
  order: string;
}

const blank: Draft = {
  city: emptyPair,
  address: emptyPair,
  phones: "",
  email: "",
  mapUrl: "",
  isHeadOffice: false,
  active: true,
  order: "0",
};

function toDraft(o: OfficeDoc): Draft {
  return {
    city: o.city ?? emptyPair,
    address: o.address ?? emptyPair,
    phones: o.phones.join(", "),
    email: o.email ?? "",
    mapUrl: o.mapUrl ?? "",
    isHeadOffice: o.isHeadOffice,
    active: o.active,
    order: String(o.order),
  };
}

export function OfficesManager({ initial }: { initial: OfficeDoc[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<OfficeDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<OfficeDoc | null>(null);
  const [pending, start] = useTransition();

  const openNew = () => {
    setDraft(blank);
    setErrors({});
    setCreating(true);
    setEditing(null);
  };
  const openEdit = (o: OfficeDoc) => {
    setDraft(toDraft(o));
    setErrors({});
    setEditing(o);
    setCreating(false);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = () => {
    const phones = draft.phones
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const payload = {
      city: draft.city,
      address: draft.address,
      phones,
      email: draft.email,
      mapUrl: draft.mapUrl,
      isHeadOffice: draft.isHeadOffice,
      active: draft.active,
      order: draft.order,
    };
    const now = new Date().toISOString();
    start(async () => {
      setErrors({});
      const res = editing
        ? await updateContent("office", editing.id, payload)
        : await createContent("office", payload);
      if (res.ok) {
        const merged: OfficeDoc = {
          id: editing?.id ?? (res.data as { id: string }).id,
          city: draft.city,
          address: draft.address,
          phones,
          email: draft.email || null,
          mapUrl: draft.mapUrl || null,
          isHeadOffice: draft.isHeadOffice,
          order: Number(draft.order) || 0,
          active: draft.active,
          createdAt: editing?.createdAt ?? now,
          updatedAt: now,
        };
        setRows((prev) => {
          // Only one head office: clear the flag on others if this one is head.
          const cleared = merged.isHeadOffice
            ? prev.map((r) => ({ ...r, isHeadOffice: false }))
            : prev;
          return editing
            ? cleared.map((r) => (r.id === merged.id ? merged : r))
            : [...cleared, merged];
        });
        toast.success(res.message ?? "Saved");
        close();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  };

  const flipActive = (o: OfficeDoc, value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === o.id ? { ...r, active: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("office", o.id, "active", value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === o.id ? { ...r, active: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteContent("office", target.id);
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
          <FiPlus /> Add office
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No offices yet"
          message="Add your first city office to build the national network."
          cta={<Button onClick={openNew}><FiPlus /> Add office</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((o) => (
            <Card key={o.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="h-4 w-4 text-navy" />
                    <h3 className="font-semibold text-slate-800">
                      {o.city.en}
                      {o.city.ur ? (
                        <span className="ml-2 font-normal text-slate-500" lang="ur">{o.city.ur}</span>
                      ) : (
                        <span className="ml-2 text-xs font-normal text-amber-600">Urdu missing</span>
                      )}
                    </h3>
                  </div>
                  {o.isHeadOffice && (
                    <span className="mt-1 inline-block rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-semibold text-navy">
                      Head office
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(o)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(o)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">{o.address.en}</p>
              <p className="mt-0.5 text-xs text-slate-400" lang="ur">{o.address.ur}</p>
              {o.phones.length > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                  <FiPhone className="h-3 w-3" /> {o.phones.join(" · ")}
                </p>
              )}
              <label className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <Toggle checked={o.active} onChange={(v) => flipActive(o, v)} /> Active
              </label>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        title={editing ? `Edit ${editing.city.en}` : "Add office"}
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
            label="City"
            required
            error={errors.city}
            value={draft.city}
            onChange={(city) => setDraft({ ...draft, city })}
          />
          <LocalizedField
            label="Address"
            required
            error={errors.address}
            multiline
            value={draft.address}
            onChange={(address) => setDraft({ ...draft, address })}
          />
          <Field label="Phone numbers" hint="Comma-separated" error={errors.phones}>
            <TextInput value={draft.phones} onChange={(e) => setDraft({ ...draft, phones: e.target.value })} placeholder="+92 51 …, +92 335 …" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email}>
              <TextInput value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
            <Field label="Sort order" error={errors.order}>
              <TextInput type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
            </Field>
          </div>
          <Field label="Google Maps URL" error={errors.mapUrl}>
            <TextInput value={draft.mapUrl} onChange={(e) => setDraft({ ...draft, mapUrl: e.target.value })} placeholder="https://maps.google.com/…" />
          </Field>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle checked={draft.isHeadOffice} onChange={(v) => setDraft({ ...draft, isHeadOffice: v })} /> Head office
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} /> Active
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete office?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={<>Remove the <strong>{toDelete?.city.en}</strong> office from the network?</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
