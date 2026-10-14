"use client";

import { useRef, useState, type DragEvent } from "react";

const sameOrder = (a: number[], b: number[]) => a.join(",") === b.join(",");

// Drag-to-reorder for one list, using the browser's own drag and drop. While dragging, the
// list reorders live as the pointer crosses the middle of another item; letting go calls
// `onCommit` with the new order. The new order is shown until the saved order arrives.
export function useReorder(ids: number[], axis: "x" | "y", onCommit: (ids: number[]) => Promise<boolean>) {
  const [draft, setDraft] = useState<number[] | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [prevIds, setPrevIds] = useState(ids);
  const draftRef = useRef<number[] | null>(null);
  const dragging = useRef<number | null>(null);

  // New ids from the server (the saved order, or an added or deleted step) replace the draft.
  if (!sameOrder(prevIds, ids)) {
    setPrevIds(ids);
    setDraft(null);
  }

  const sameSet = draft !== null && draft.length === ids.length && draft.every((id) => ids.includes(id));
  const order = sameSet ? draft : ids;

  function update(next: number[] | null) {
    draftRef.current = next;
    setDraft(next);
  }

  function itemProps(id: number) {
    return {
      onDragStart: (event: DragEvent<HTMLElement>) => {
        // A sub-step inside a step card must not also start dragging the card.
        event.stopPropagation();
        dragging.current = id;
        setDraggingId(id);
        update(order);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(id));
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        const from = dragging.current;
        // Only this list's own drags are handled here; anything else passes to the list outside.
        if (from === null) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "move";
        if (from === id) return;
        const box = event.currentTarget.getBoundingClientRect();
        const before = axis === "x" ? event.clientX < box.left + box.width / 2 : event.clientY < box.top + box.height / 2;
        const current = draftRef.current ?? order;
        const next = current.filter((other) => other !== from);
        next.splice(next.indexOf(id) + (before ? 0 : 1), 0, from);
        if (!sameOrder(next, current)) update(next);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (dragging.current === null) return;
        event.preventDefault();
        event.stopPropagation();
      },
      onDragEnd: (event: DragEvent<HTMLElement>) => {
        event.stopPropagation();
        dragging.current = null;
        setDraggingId(null);
        const next = draftRef.current;
        if (!next || sameOrder(next, ids)) return update(null);
        void onCommit(next).then((saved) => {
          if (!saved) update(null);
        });
      },
    };
  }

  return { order, draggingId, itemProps };
}
