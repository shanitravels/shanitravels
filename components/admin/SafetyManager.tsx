"use client";

import { useState, useTransition } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useToast } from "./Toast";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, TextInput, Select, Toggle, Button, LocalizedField } from "./form";
import { EmptyState, Card } from "./parts";
import { createContent, updateContent, toggleContentFlag, deleteContent } from "@/lib/actions/content";
import { slugify } from "@/lib/format";
import {
  SAFETY_CATEGORIES,
  SAFETY_CATEGORY_LABELS,
  type SafetySectionDoc,
  type SafetyCategory,
} from "@/lib/types";
import type { LocalizedString } from "@/lib/i18n/localize";

const emptyPair: LocalizedString = { en: "", ur: "" };

/**
 * The protocol lines are stored as an array of pairs but edited as two blocks
 * of newline-separated text — the shape that made this form quick to use in the
 * first place. Line N of the English box pairs with line N of the Urdu box.
 */
function linesToPairs(text: LocalizedString): LocalizedString[] {
  const en = text.en.split("\n").map((l) => l.trim());
  const ur = text.ur.split("\n").map((l) => l.trim());
  const rows: LocalizedString[] = [];
  for (let i = 0; i < Math.max(en.length, ur.length); i++) {
    const pair = { en: en[i] ?? "", ur: ur[i] ?? "" };
    // A line is only dropped when *both* languages are blank; an English line
    // with no translation yet must survive so it can be filled in later.
    if (pair.en || pair.ur) rows.push(pair);
  }
  return rows;
}

function pairsToLines(items: LocalizedString[] = []): LocalizedString {
  return {
    en: items.map((i) => i.en ?? "").join("\n"),
    ur: items.map((i) => i.ur ?? "").join("\n"),
  };
}

/** Non-blank line count, per language — surfaced so a mismatch is visible. */
function lineCounts(text: LocalizedString): { en: number; ur: number } {
  const count = (s: string) => s.split("\n").filter((l) => l.trim()).length;
  return { en: count(text.en), ur: count(text.ur) };
}

interface Draft {
  title: LocalizedString;
  slug: string;
  slugTouched: boolean;
  category: SafetyCategory;
  intro: LocalizedString;
  itemsText: LocalizedString;
  order: string;
  active: boolean;
}

const blank: Draft = {
  title: emptyPair, slug: "", slugTouched: false, category: "chauffeur", intro: emptyPair, itemsText: emptyPair, order: "0", active: true,
};

export function SafetyManager({ initial }: { initial: SafetySectionDoc[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<SafetySectionDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [toDelete, setToDelete] = useState<SafetySectionDoc | null>(null);
  const [pending, start] = useTransition();
  const counts = lineCounts(draft.itemsText);

  // The slug follows the *English* title until the user edits the slug directly.
  const setTitle = (title: LocalizedString) =>
    setDraft((d) => ({ ...d, title, slug: d.slugTouched ? d.slug : slugify(title.en) }));

  const openNew = (category: SafetyCategory) => {
    setDraft({ ...blank, category });
    setErrors({}); setCreating(true); setEditing(null);
  };
  const openEdit = (s: SafetySectionDoc) => {
    setDraft({
      title: s.title ?? emptyPair, slug: s.slug, slugTouched: true, category: s.category,
      intro: s.intro ?? emptyPair, itemsText: pairsToLines(s.items),
      order: String(s.order), active: s.active,
    });
    setErrors({}); setEditing(s); setCreating(false);
  };
  const close = () => { setCreating(false); setEditing(null); };

  const save = () => {
    const items = linesToPairs(draft.itemsText);
    const payload = {
      title: draft.title, slug: draft.slug, category: draft.category,
      intro: draft.intro, items, order: draft.order, active: draft.active,
    };
    const now = new Date().toISOString();
    start(async () => {
      setErrors({});
      const res = editing
        ? await updateContent("safety", editing.id, payload)
        : await createContent("safety", payload);
      if (res.ok) {
        const merged: SafetySectionDoc = {
          id: editing?.id ?? (res.data as { id: string }).id,
          title: draft.title, slug: draft.slug, category: draft.category,
          intro: draft.intro, items, order: Number(draft.order) || 0, active: draft.active,
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

  const flip = (s: SafetySectionDoc, value: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === s.id ? { ...r, active: value } : r)));
    start(async () => {
      const res = await toggleContentFlag("safety", s.id, "active", value);
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
      const res = await deleteContent("safety", target.id);
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== target.id));
        toast.success(res.message ?? "Deleted");
      } else toast.error(res.error);
      setToDelete(null);
    });
  };

  return (
    <div className="space-y-8">
      {SAFETY_CATEGORIES.map((category) => {
        const inCat = rows.filter((r) => r.category === category).sort((a, b) => a.order - b.order);
        return (
          <section key={category}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">{SAFETY_CATEGORY_LABELS[category]}</h2>
              <Button size="sm" variant="secondary" onClick={() => openNew(category)}>
                <FiPlus /> Add section
              </Button>
            </div>
            {inCat.length === 0 ? (
              <EmptyState title="No sections" message={`Add the first ${SAFETY_CATEGORY_LABELS[category].toLowerCase()} section.`} />
            ) : (
              <div className="space-y-2">
                {inCat.map((s) => (
                  <Card key={s.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{s.title.en}</p>
                      <p className="truncate text-xs text-slate-400" lang="ur">
                        {s.title.ur || <span className="text-amber-600">Urdu missing</span>}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {s.items.length} line(s){s.intro?.en ? ` · ${s.intro.en}` : ""}
                      </p>
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
          </section>
        );
      })}

      <Modal
        open={creating || !!editing}
        title={editing ? `Edit ${editing.title}` : "Add safety section"}
        onClose={close}
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={save} pending={pending}>{editing ? "Save" : "Create"}</Button></>}
      >
        <div className="space-y-4">
          <LocalizedField
            label="Title"
            required
            error={errors.title}
            value={draft.title}
            onChange={setTitle}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" required error={errors.slug}>
              <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value, slugTouched: true })} invalid={!!errors.slug} />
            </Field>
            <Field label="Category" required error={errors.category}>
              <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as SafetyCategory })}>
                {SAFETY_CATEGORIES.map((c) => <option key={c} value={c}>{SAFETY_CATEGORY_LABELS[c]}</option>)}
              </Select>
            </Field>
          </div>
          <LocalizedField
            label="Intro"
            error={errors.intro}
            hint="One or two sentences framing the section"
            multiline
            value={draft.intro}
            onChange={(intro) => setDraft({ ...draft, intro })}
          />
          <LocalizedField
            label="Protocol lines"
            required
            error={errors.items}
            hint={
              counts.en === counts.ur
                ? `One bullet per line · ${counts.en} line(s)`
                : `Line ${counts.en} in English vs ${counts.ur} in Urdu — they pair up by position, so mismatched counts will misalign.`
            }
            multiline
            value={draft.itemsText}
            onChange={(itemsText) => setDraft({ ...draft, itemsText })}
            controlClassName="min-h-[160px]"
          />
          <div className="flex items-center justify-between">
            <Field label="Sort order" className="w-28">
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
        title="Delete safety section?"
        destructive
        pending={pending}
        confirmLabel="Delete"
        message={<>Remove <strong>{toDelete?.title.en}</strong> from the published protocol?</>}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
