"use client";

import type { AdminReviewDto } from "@rubies/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useToast } from "@/components/ToastProvider";
import { ApiRequestError, clientApi } from "@/lib/client-api";

export default function AdminReviewsPage() {
  return (
    <AdminShell title="Reviews" subtitle="Moderation">
      <AdminReviews />
    </AdminShell>
  );
}

function AdminReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReviewDto[] | null>(null);

  async function load() {
    setReviews(await clientApi.listAdminReviews());
  }

  useEffect(() => {
    void load().catch(() => setReviews([]));
  }, []);

  async function toggleHidden(review: AdminReviewDto) {
    try {
      await clientApi.updateReviewVisibility(review.id, !review.hidden);
      await load();
      toast(review.hidden ? "Review visible" : "Review hidden");
    } catch (err) {
      toast({ message: err instanceof ApiRequestError ? err.message : "Update failed", sound: false });
    }
  }

  if (!reviews) {
    return <p className="py-8 text-center text-sm text-muted">Loading reviews…</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-card bg-white/80 px-4 py-10 text-center text-sm text-muted shadow-soft">
        No reviews yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-[20px] bg-white p-4 shadow-soft ring-1 ring-black/[0.04]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">
                {"★".repeat(review.rating)}
                <span className="ml-1 text-xs font-medium text-muted">
                  {review.rating}/5
                </span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {review.guestName ?? "Customer"} ·{" "}
                <Link
                  href={`/orders/${review.orderNumber}`}
                  className="font-semibold text-rubies-blue"
                >
                  {review.orderNumber}
                </Link>
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                review.hidden
                  ? "bg-black/10 text-muted"
                  : "bg-emerald-100 text-emerald-900"
              }`}
            >
              {review.hidden ? "Hidden" : "Visible"}
            </span>
          </div>
          {review.comment ? (
            <p className="mt-3 text-sm text-ink">{review.comment}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">No comment</p>
          )}
          <button
            type="button"
            onClick={() => void toggleHidden(review)}
            className="mt-3 rounded-full bg-cream-deep px-3 py-1.5 text-xs font-semibold text-ink"
          >
            {review.hidden ? "Unhide" : "Hide"}
          </button>
        </li>
      ))}
    </ul>
  );
}
