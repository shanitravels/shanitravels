"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Select, Toggle, Button } from "./form";
import { SingleImageField } from "./ImageManager";
import { EmptyState, Card } from "./parts";
import {
  createContent,
  updateContent,
  toggleContentFlag,
  deleteContent,
} from "@/lib/actions/content";
import { CLIENT_SECTORS, CLIENT_SECTOR_LABELS, type Client, type ClientSector } from "@/lib/types";

interface Draft {
  name: string;
  sector: ClientSector;
  logo: { publicId: string; url: string; alt: string } | null;
  featured: boolean;
  active: boolean;
  order: string;
}

const blank: Draft = { name: "", sector: "un-donor", logo: null, featured: false, active: true, order: "0" };

export function ClientsManager({ initial }: { initial: Client[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(
    () => rows.filter((c) => filter === "all" || c.sector === filter),
    [rows, filter]
  );

  const openNew = () => {
    setDraft(blank);
    setErrors({});
    setCreating(true);
    setEditing(null);
  };
  const openEdit = (c: Client) => {
    setDraft({
      name: c.name,
      sector: c.sector,
      logo: c.logo ?? null,
      featured: c.featured,
      active: c.active,
      order: String(c.order),
    });
    setErrors({});
    setEditing(c);
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
        ? await updateContent("client", editing.id, payload)
        : await createContent("client", payload);
      if (res.ok) {
        const merged: Client = {
          id: editing?.id ?? (res.data as { id: string }).id,
          name: draft.name,
          sector: draft.sector,
          logo: draft.logo,
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

  const flip = (c: Client, flag: "active" | "featured", value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, [flag]: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("client", c.id, flag, value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, [flag]: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteContent("client", target.id);
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
          <option value="all">All sectors</option>
          {CLIENT_SECTORS.map((s) => (
            <option key={s} value={s}>
              {CLIENT_SECTOR_LABELS[s]}
            </option>
          ))}
        </select>
        <Button className="ml-auto" onClick={openNew}>
          <FiPlus /> Add client
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No clients here"
          message="Add the organizations that trust Shani Travels — logos display on the client wall."
          cta={<Button onClick={openNew}><FiPlus /> Add client</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col p-4">
              <div className="flex h-16 items-center justify-center rounded-lg bg-slate-50">
                {c.logo ? (
                  <div className="relative h-12 w-full">
                    <Image src={c.logo.url} alt={c.logo.alt || c.name} fill className="object-contain" sizes="160px" />
                  </div>
                ) : (
                  <span className="px-2 text-center text-sm font-semibold text-slate-500">{c.name}</span>
                )}
              </div>
              <p className="mt-2 truncate text-center text-xs font-medium text-slate-700">{c.name}</p>
              <p className="text-center text-[10px] text-slate-400">{CLIENT_SECTOR_LABELS[c.sector]}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500" title="Featured">
                  <Toggle checked={c.featured} onChange={(v) => flip(c, "featured", v)} /> Feat.
                </label>
                <div className="flex gap-0.5">
                  <button onClick={() => openEdit(c)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setToDelete(c)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <FiTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={creating || !!editing}
        title={editing ? `Edit ${editing.name}` : "Add client"}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={save} pending={pending}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Organization name" required error={errors.name}>
            <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} invalid={!!errors.name} />
          </Field>
          <Field label="Sector" required error={errors.sector}>
            <Select value={draft.sector} onChange={(e) => setDraft({ ...draft, sector: e.target.value as ClientSector })}>
              {CLIENT_SECTORS.map((s) => (
                <option key={s} value={s}>{CLIENT_SECTOR_LABELS[s]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Logo" hint="Transparent PNG works best on the client wall.">
            <SingleImageField
              value={draft.logo}
              onChange={(logo) => setDraft({ ...draft, logo })}
              subfolder="clients"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
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
        title="Delete client?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={<>Remove <strong>{toDelete?.name}</strong> from the client wall?</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
