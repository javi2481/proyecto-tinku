'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  regenerateLoginCodeAction,
  requestDeleteStudentAction,
  cancelDeleteStudentAction,
} from '@/lib/students/actions';
import { strings } from '@/content/strings/es-AR';
import { cn } from '@/lib/utils/cn';

interface Props {
  studentId: string;
  loginCode?: string;
  mode: 'actions' | 'cancel-deletion';
}

export function StudentActions({ studentId, loginCode, mode }: Props) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onCopy = async () => {
    if (!loginCode) return;
    try {
      await navigator.clipboard.writeText(loginCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard bloqueado: ignorar silenciosamente */
    }
  };

  const onRegen = () => {
    startTransition(async () => {
      const res = await regenerateLoginCodeAction(studentId);
      if (res.ok) setNotice('Código regenerado.');
      else setNotice('No pudimos regenerar. Probá de nuevo.');
      setConfirmRegen(false);
    });
  };

  const onRequestDelete = () => {
    startTransition(async () => {
      await requestDeleteStudentAction(studentId);
      // redirige a /dashboard desde el server action
    });
  };

  const onCancelDelete = () => {
    startTransition(async () => {
      const res = await cancelDeleteStudentAction(studentId);
      if (res.ok) setNotice('Baja cancelada.');
    });
  };

  if (mode === 'cancel-deletion') {
    return (
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={onCancelDelete}
          disabled={isPending}
          data-testid="cancel-deletion-btn"
          className="h-10 px-4 rounded-xl bg-tinku-leaf text-white font-medium hover:bg-tinku-leaf/90 disabled:opacity-60"
        >
          {isPending ? 'Cancelando…' : strings.parent.students.detail.cancelDeletion}
        </button>
        {notice && <p data-testid="cancel-notice" className="text-xs text-tinku-leaf self-center">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex gap-2 flex-wrap">
        {loginCode && (
          <button
            type="button"
            onClick={onCopy}
            data-testid="copy-code-btn"
            className="h-10 px-4 rounded-xl border border-tinku-ink/15 text-tinku-ink font-medium hover:bg-tinku-ink/5"
          >
            {copied ? strings.parent.students.detail.copied : strings.parent.students.detail.copyCode}
          </button>
        )}
        <Link
          href={`/students/${studentId}/edit`}
          data-testid="edit-student-link"
          className="h-10 px-4 rounded-xl border border-tinku-ink/15 text-tinku-ink font-medium inline-flex items-center hover:bg-tinku-ink/5"
        >
          {strings.parent.students.detail.edit}
        </Link>
        <button
          type="button"
          onClick={() => setConfirmRegen((v) => !v)}
          data-testid="regen-code-btn"
          className="h-10 px-4 rounded-xl border border-tinku-ink/15 text-tinku-ink font-medium hover:bg-tinku-ink/5"
        >
          {strings.parent.students.detail.regen}
        </button>
      </div>

      {confirmRegen && (
        <div data-testid="regen-confirm" className="rounded-xl border border-tinku-warn/40 bg-tinku-warn/5 p-3 space-y-2">
          <p className="text-sm text-tinku-ink">{strings.parent.students.detail.regenConfirm}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRegen}
              disabled={isPending}
              data-testid="regen-confirm-yes"
              className="h-9 px-3 rounded-lg bg-tinku-warn text-white text-sm font-medium hover:bg-tinku-warn/90 disabled:opacity-60"
            >
              Sí, regenerar
            </button>
            <button
              type="button"
              onClick={() => setConfirmRegen(false)}
              className="h-9 px-3 rounded-lg border border-tinku-ink/15 text-sm"
            >
              {strings.common.cancel}
            </button>
          </div>
        </div>
      )}

      {notice && <p data-testid="action-notice" className="text-xs text-tinku-leaf">{notice}</p>}

      <div className="pt-4 border-t border-tinku-ink/10">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            data-testid="request-delete-btn"
            className={cn(
              'text-sm font-medium',
              'text-tinku-warn hover:text-tinku-warn/80',
            )}
          >
            {strings.parent.students.detail.requestDelete}
          </button>
        ) : (
          <div data-testid="delete-confirm" className="rounded-xl border border-tinku-warn/40 bg-tinku-warn/5 p-4 space-y-3">
            <p className="text-sm text-tinku-ink">{strings.parent.students.detail.requestDeleteConfirm}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRequestDelete}
                disabled={isPending}
                data-testid="request-delete-yes"
                className="h-10 px-4 rounded-xl bg-tinku-warn text-white font-medium hover:bg-tinku-warn/90 disabled:opacity-60"
              >
                {isPending ? 'Procesando…' : 'Sí, dar de baja'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-10 px-4 rounded-xl border border-tinku-ink/15 font-medium"
              >
                {strings.common.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
