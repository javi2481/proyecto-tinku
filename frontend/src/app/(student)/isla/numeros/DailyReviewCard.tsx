import Link from 'next/link';
import { strings } from '@/content/strings/es-AR';

interface Props {
  alreadyDoneToday: boolean;
}

export function DailyReviewCard({ alreadyDoneToday }: Props) {
  if (alreadyDoneToday) {
    return (
      <section
        data-testid="daily-review-card"
        data-state="done"
        className="rounded-3xl bg-tinku-leaf/10 border-2 border-tinku-leaf/40 p-5 sm:p-6 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-tinku-leaf/25 flex items-center justify-center text-3xl shrink-0" aria-hidden>
          ✅
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-tinku-ink">{strings.student.dailyReview.doneCardTitle}</h3>
          <p className="text-sm text-tinku-ink/70">{strings.student.dailyReview.doneCardBody}</p>
        </div>
      </section>
    );
  }

  return (
    <Link
      href="/isla/numeros/repaso"
      data-testid="daily-review-card"
      data-state="open"
      className="block rounded-3xl bg-gradient-to-br from-tinku-sea to-tinku-sea/80 text-white p-5 sm:p-6 hover:shadow-lg hover:scale-[1.01] transition-all exercise-target"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0" aria-hidden>
          ⏱️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wide">{strings.student.dailyReview.pill}</p>
          <h3 className="text-lg font-bold">{strings.student.dailyReview.cardTitle}</h3>
          <p className="text-sm text-white/90">{strings.student.dailyReview.cardBody}</p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/20 shrink-0" aria-hidden>
          →
        </div>
      </div>
    </Link>
  );
}
