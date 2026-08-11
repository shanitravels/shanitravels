"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiTag, FiCalendar } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Select, Toggle, Button, LocalizedField } from "./form";
import { EmptyState, Card } from "./parts";
import {
  createDiscount,
  updateDiscount,
  setDiscountActive,
  deleteDiscount,
} from "@/lib/actions/discounts";
import { isDiscountLive, discountSummary } from "@/lib/pricing";
import { formatDate, formatPKR } from "@/lib/format";
import {
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  type DiscountDoc,
  type DiscountScope,
  type DiscountType,
  type Vehicle,
  type VehicleClass,
} from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";

const emptyPair: LocalizedString = { en: "", ur: "" };

interface Draft {
  name: string;
  label: LocalizedString;
  type: DiscountType;
  value: string;
  scope: DiscountScope;
  vehicleClasses: VehicleClass[];
  vehicles: string[];
  startDate: string;
  endDate: string;
  active: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

const blank = (): Draft => ({
  name: "",
  label: emptyPair,
  type: "percentage",
  value: "",
  scope: "all",
  vehicleClasses: [],
  vehicles: [],
  startDate: today(),
  endDate: "",
  active: true,
});

function toDraft(d: DiscountDoc): Draft {
  return {
    name: d.name,
    label: d.label ?? emptyPair,
    type: d.type,
    value: String(d.value),
    scope: d.scope,
    vehicleClasses: d.vehicleClasses,
    vehicles: d.vehicles,
    startDate: d.startDate.slice(0, 10),
    endDate: d.endDate ? d.endDate.slice(0, 10) : "",
    active: d.active,
  };
}

export function DiscountsManager({
  initial,
  vehicles,
}: {
  initial: DiscountDoc[];
  vehicles: Vehicle[];
}) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<DiscountDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<DiscountDoc | null>(null);
  const [pending, start] = useTransition();

  const open = editing !== null || creating;
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const openCreate = () => { setDraft(blank()); setErrors({}); setCreating(true); };
  const openEdit = (d: DiscountDoc) => { setDraft(toDraft(d)); setErrors({}); setEditing(d); };
  const close = () => { setEditing(null); setCreating(false); setErrors({}); };

  const save = () => {
    const payload = {
      ...draft,
      value: Number(draft.value),
      endDate: draft.endDate || null,
    };
    start(async () => {
      const res = editing
        ? await updateDiscount(editing.id, payload)
        : await createDiscount(payload);
      if (res.ok) {
        const saved = res.data;
        if (saved) {
          setRows((rs) => (editing ? rs.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...rs]));
        }
        toast.success(res.message ?? "Saved");
        close();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  };

  const toggle = (d: DiscountDoc, active: boolean) => {
    start(async () => {
      const res = await setDiscountActive(d.id, active);
      if (res.ok) {
        setRows((rs) => rs.map((r) => (r.id === d.id ? { ...r, active } : r)));
        toast.success(res.message ?? "Saved");
      } else toast.error(res.error);
    });
  };

  const remove = () => {
    if (!toDelete) return;
    const d = toDelete;
    start(async () => {
      const res = await deleteDiscount(d.id);
      if (res.ok) {
        setRows((rs) => rs.filter((r) => r.id !== d.id));
        toast.success(res.message ?? "Deleted");
      } else toast.error(res.error);
      setToDelete(null);
    });
  };

  const err = (k: string) => errors[k];

  /** Live preview so the admin sees the real effect before saving. */
  const previewBase = vehicles.find((v) => (v.rates.perDay ?? 0) > 0)?.rates.perDay ?? 10000;
  const previewValue = Number(draft.value) || 0;
  const previewOff =
    draft.type === "percentage"
      ? Math.round((previewBase * previewValue) / 100)
      : Math.round(previewValue);
  const previewAfter = Math.max(0, previewBase - Math.min(previewBase, previewOff));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <FiPlus className="h-4 w-4" /> New discount
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No discounts yet"
          message="Create one to reduce published rates across the whole fleet, a vehicle class, or specific vehicles."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((d) => {
            const live = isDiscountLive(d);
            return (
              <Card key={d.id} className="flex flex-wrap items-center gap-4 p-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    live ? "bg-accent text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <FiTag className="h-3.5 w-3.5" /> {d.label.en}
                  {d.label.ur ? (
                    <span className="ml-1.5 font-urdu" lang="ur">{d.label.ur}</span>
                  ) : (
                    <span className="ml-1.5 text-amber-600">Urdu missing</span>
                  )}
                </span>

                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {discountSummary(d)} · {scopeLabel(d, vehicles)}
                  </p>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <FiCalendar className="h-3.5 w-3.5" />
                  {formatDate(d.startDate)} — {d.endDate ? formatDate(d.endDate) : "no end date"}
                </p>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    live
                      ? "bg-emerald-100 text-emerald-700"
                      : d.active
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {live ? "Live" : d.active ? "Scheduled" : "Paused"}
                </span>

                <div className="flex items-center gap-2">
                  <Toggle checked={d.active} onChange={(v) => toggle(d, v)} label={`Activate ${d.name}`} />
                  <button onClick={() => openEdit(d)} className={iconBtn} aria-label={`Edit ${d.name}`}>
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setToDelete(d)} className={`${iconBtn} hover:text-red-600`} aria-label={`Delete ${d.name}`}>
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={close} title={editing ? "Edit discount" : "New discount"}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" hint="Internal — not shown publicly" error={err("name")}>
              <TextInput value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Eid Special 2026" />
            </Field>
            <LocalizedField
              label="Badge text"
              hint="Shown on the public site"
              error={err("label")}
              maxLength={40}
              value={draft.label}
              onChange={(label) => set("label", label)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" error={err("type")}>
              <Select value={draft.type} onChange={(e) => set("type", e.target.value as DiscountType)}>
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off (PKR)</option>
              </Select>
            </Field>
            <Field label={draft.type === "percentage" ? "Percent off" : "Rupees off"} error={err("value")}>
              <TextInput
                type="number"
                min="0"
                max={draft.type === "percentage" ? "100" : undefined}
                value={draft.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={draft.type === "percentage" ? "15" : "2000"}
              />
            </Field>
          </div>

          {previewValue > 0 && (
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              A vehicle at <b className="text-slate-900">{formatPKR(previewBase)}</b>/day would show{" "}
              <b className="text-slate-900">{formatPKR(previewAfter)}</b> — saving {formatPKR(previewOff)}.
            </p>
          )}

          <Field label="Applies to" error={err("scope")}>
            <Select value={draft.scope} onChange={(e) => set("scope", e.target.value as DiscountScope)}>
              <option value="all">Every vehicle</option>
              <option value="class">Selected vehicle classes</option>
              <option value="vehicle">Selected vehicles</option>
            </Select>
          </Field>

          {draft.scope === "class" && (
            <Field label="Vehicle classes" error={err("vehicleClasses")}>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_CLASSES.map((c) => {
                  const on = draft.vehicleClasses.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        set("vehicleClasses", on ? draft.vehicleClasses.filter((x) => x !== c) : [...draft.vehicleClasses, c])
                      }
                      className={chip(on)}
                    >
                      {VEHICLE_CLASS_LABELS[c]}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {draft.scope === "vehicle" && (
            <Field label="Vehicles" error={err("vehicles")}>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {vehicles.map((v) => {
                  const on = draft.vehicles.includes(v.id);
                  return (
                    <label key={v.id} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          set("vehicles", on ? draft.vehicles.filter((x) => x !== v.id) : [...draft.vehicles, v.id])
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="flex-1 text-slate-700">{v.name}</span>
                      <span className="text-xs text-slate-400">
                        {v.rates.perDay ? formatPKR(v.rates.perDay) : "On request"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" error={err("startDate")}>
              <TextInput type="date" value={draft.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            <Field label="Ends" hint="Leave blank to run until paused" error={err("endDate")}>
              <TextInput type="date" value={draft.endDate} min={draft.startDate} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
          </div>

          <Toggle checked={draft.active} onChange={(v) => set("active", v)} label="Active" />

          <p className="text-xs text-slate-500">
            Vehicles priced “On request” are never discounted — there is no published figure to
            reduce. Where several discounts match one vehicle, the customer sees the largest;
            they do not stack.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={save} pending={pending}>{editing ? "Save changes" : "Create discount"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete discount"
        message={`Delete “${toDelete?.name}”? Prices return to their published rates immediately.`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function scopeLabel(d: DiscountDoc, vehicles: Vehicle[]): string {
  if (d.scope === "all") return "every vehicle";
  if (d.scope === "class") {
    return d.vehicleClasses.map((c) => VEHICLE_CLASS_LABELS[c]).join(", ") || "no classes selected";
  }
  const names = d.vehicles.map((id) => vehicles.find((v) => v.id === id)?.name).filter(Boolean);
  if (names.length === 0) return "no vehicles selected";
  return names.length <= 2 ? names.join(", ") : `${names.length} vehicles`;
}

const iconBtn =
  "rounded-lg border border-slate-300 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-navy";

const chip = (on: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
    on ? "border-navy bg-navy text-white" : "border-slate-300 text-slate-600 hover:bg-slate-50"
  }`;
