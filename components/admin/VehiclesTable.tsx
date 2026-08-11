"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { useToast } from "./Toast";
import { Toggle } from "./form";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState, Card } from "./parts";
import { toggleVehicleFlag, deleteVehicle } from "@/lib/actions/vehicles";
import { formatRateCell } from "@/lib/format";
import { VEHICLE_CLASSES, VEHICLE_CLASS_LABELS, type Vehicle } from "@/lib/types";

export function VehiclesTable({ initial }: { initial: Vehicle[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(
    () =>
      rows.filter(
        (v) =>
          (classFilter === "all" || v.class === classFilter) &&
          (statusFilter === "all" ||
            (statusFilter === "active" ? v.active : !v.active))
      ),
    [rows, classFilter, statusFilter]
  );

  const flip = (v: Vehicle, flag: "active" | "featured", value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === v.id ? { ...r, [flag]: value } : r)));
    start(async () => {
      const res = await toggleVehicleFlag(v.id, flag, value);
      if (!res.ok) {
        setRows((prev) => prev.map((r) => (r.id === v.id ? { ...r, [flag]: !value } : r)));
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteVehicle(target.id);
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== target.id));
        toast.success(res.message ?? "Deleted");
        setToDelete(null);
      } else {
        toast.error(res.error);
        setToDelete(null);
      }
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All classes</option>
          {VEHICLE_CLASSES.map((c) => (
            <option key={c} value={c}>
              {VEHICLE_CLASS_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} vehicle(s)</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No vehicles here"
          message="Adjust the filters, or add your first vehicle to the catalog."
          cta={
            <Link
              href="/admin/vehicles/new"
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
            >
              <FiPlus /> Add vehicle
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table — scrolls rather than clips, since the md breakpoint
              turns on the sidebar and this table at the same time. */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 text-right font-medium">Per day</th>
                  <th className="px-4 py-3 text-center font-medium">Featured</th>
                  <th className="px-4 py-3 text-center font-medium">Active</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb v={v} />
                        <div>
                          <p className="font-medium text-slate-800">{v.name}</p>
                          <p className="text-xs text-slate-400">{v.seats} seats · /{v.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{VEHICLE_CLASS_LABELS[v.class]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatRateCell(v.rates.perDay)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={v.featured} onChange={(val) => flip(v, "featured", val)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={v.active} onChange={(val) => flip(v, "active", val)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/vehicles/${v.id}/edit`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
                          title="Edit"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setToDelete(v)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((v) => (
              <Card key={v.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Thumb v={v} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{v.name}</p>
                    <p className="text-xs text-slate-400">
                      {VEHICLE_CLASS_LABELS[v.class]} · PKR {formatRateCell(v.rates.perDay)}/day
                    </p>
                  </div>
                  <Link
                    href={`/admin/vehicles/${v.id}/edit`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setToDelete(v)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-sm">
                  <label className="flex items-center gap-2">
                    <Toggle checked={v.featured} onChange={(val) => flip(v, "featured", val)} />
                    <span className="text-xs text-slate-500">Featured</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Toggle checked={v.active} onChange={(val) => flip(v, "active", val)} />
                    <span className="text-xs text-slate-500">Active</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Permanently delete vehicle?"
        destructive
        requireTyped="DELETE"
        pending={pending}
        confirmLabel="Delete forever"
        message={
          <>
            This permanently removes <strong>{toDelete?.name}</strong> and its photos references.
            Prefer deactivating instead — deletion is blocked if any booking references it.
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Thumb({ v }: { v: Vehicle }) {
  const src = v.images[0]?.url;
  return (
    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100">
      {src ? (
        <Image src={src} alt={v.images[0]?.alt || v.name} fill className="object-cover" sizes="56px" />
      ) : (
        <span className="flex h-full items-center justify-center text-[10px] text-slate-300">
          No photo
        </span>
      )}
    </div>
  );
}
