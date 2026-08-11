"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Select, Toggle, Button } from "./form";
import { Card } from "./parts";
import { createAdminUser, updateAdminUser, deleteAdminUser } from "@/lib/actions/users";
import { formatDate } from "@/lib/format";
import { ADMIN_ROLES, type AdminUser, type AdminRole } from "@/lib/types";

interface Draft {
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  password: string;
}

const blank: Draft = { email: "", name: "", role: "admin", active: true, password: "" };

export function UsersManager({ initial, currentUserId }: { initial: AdminUser[]; currentUserId: string }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);
  const [pending, start] = useTransition();

  const openNew = () => {
    setDraft(blank);
    setErrors({});
    setCreating(true);
    setEditing(null);
  };
  const openEdit = (u: AdminUser) => {
    setDraft({ email: u.email, name: u.name, role: u.role, active: u.active, password: "" });
    setErrors({});
    setEditing(u);
    setCreating(false);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = () => {
    const payload = {
      email: draft.email,
      name: draft.name,
      role: draft.role,
      active: draft.active,
      ...(draft.password ? { password: draft.password } : {}),
    };
    const now = new Date().toISOString();
    start(async () => {
      setErrors({});
      const res = editing
        ? await updateAdminUser(editing.id, payload)
        : await createAdminUser(payload);
      if (res.ok) {
        const merged: AdminUser = {
          id: editing?.id ?? (res.data as { id: string }).id,
          email: draft.email.toLowerCase(),
          name: draft.name,
          role: draft.role,
          active: draft.active,
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

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    start(async () => {
      const res = await deleteAdminUser(target.id);
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== target.id));
        toast.success(res.message ?? "Removed");
      } else toast.error(res.error);
      setToDelete(null);
    });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <FiPlus /> Invite user
        </Button>
      </div>

      {/* overflow-x-auto, not hidden: at 320px the table is ~650px wide, and
          hiding the excess made the trailing columns unreachable. */}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-semibold text-navy">You</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 capitalize text-slate-500">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {u.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(u)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    {u.id !== currentUserId && (
                      <button onClick={() => setToDelete(u)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal
        open={creating || !!editing}
        title={editing ? `Edit ${editing.name}` : "Invite user"}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={save} pending={pending}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name" required error={errors.name}>
            <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} invalid={!!errors.name} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <TextInput type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} invalid={!!errors.email} />
          </Field>
          <Field label="Role" required error={errors.role} hint="Editors manage content; admins also manage settings & users.">
            <Select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as AdminRole })}>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </Select>
          </Field>
          <Field
            label={editing ? "Reset password" : "Password"}
            required={!editing}
            error={errors.password}
            hint={editing ? "Leave blank to keep the current password." : "At least 8 characters."}
          >
            <TextInput
              type="password"
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              autoComplete="new-password"
              invalid={!!errors.password}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Toggle checked={draft.active} onChange={(v) => setDraft({ ...draft, active: v })} /> Active (can sign in)
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Remove user?"
        destructive
        pending={pending}
        confirmLabel="Remove"
        message={<>Remove <strong>{toDelete?.name}</strong>? They will no longer be able to sign in.</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
