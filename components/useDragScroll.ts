"use client";

import { useCallback } from "react";

// Quanto precisa arrastar (px) ou a velocidade (px/ms) para já passar ao próximo card
const SWIPE_DISTANCE = 30;
const SWIPE_VELOCITY = 0.3;
const ANIMATION_MS = 420;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Permite passar os cards de um container horizontal segurando e arrastando com o mouse.
 * No toque o navegador já faz isso nativamente, então só o mouse é tratado.
 * Ao soltar, um arraste curto ou um "flick" rápido já leva ao card seguinte/anterior,
 * com animação suave. Retorna uma ref de callback (funciona se o container remontar).
 */
export default function useDragScroll<T extends HTMLElement>() {
  return useCallback((el: T | null) => {
    if (!el) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px/ms, positivo = arrastando para a esquerda (avançando)
    let moved = false;
    let suppressClick = false;
    let frame = 0;

    // Posições de encaixe de cada card, respeitando o scroll-padding (espaçamento à esquerda)
    const snapPositions = () => {
      const padLeft = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
      const elLeft = el.getBoundingClientRect().left;
      const max = el.scrollWidth - el.clientWidth;
      const positions = Array.from(el.children).map((child) =>
        Math.min(max, Math.max(0, el.scrollLeft + child.getBoundingClientRect().left - elLeft - padLeft)),
      );
      return [...new Set(positions.map(Math.round))].sort((a, b) => a - b);
    };

    const nearestIndex = (positions: number[], x: number) =>
      positions.reduce((best, p, i) => (Math.abs(p - x) < Math.abs(positions[best] - x) ? i : best), 0);

    const animateTo = (target: number) => {
      cancelAnimationFrame(frame);
      const from = el.scrollLeft;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ANIMATION_MS);
        el.scrollLeft = from + (target - from) * easeOutCubic(t);
        if (t < 1) frame = requestAnimationFrame(step);
        else el.style.scrollSnapType = ""; // religa o snap só no fim
      };
      frame = requestAnimationFrame(step);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(frame);
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      lastT = e.timeStamp;
      startScroll = el.scrollLeft;
      velocity = 0;
      moved = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      if (!moved) {
        // Pequena tolerância para não transformar clique em arraste
        if (Math.abs(dx) < 5) return;
        moved = true;
        el.setPointerCapture(e.pointerId);
        el.style.scrollSnapType = "none";
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
      }
      const dt = e.timeStamp - lastT;
      if (dt > 0) {
        // Média móvel para a velocidade não oscilar
        velocity = 0.8 * ((lastX - e.clientX) / dt) + 0.2 * velocity;
      }
      lastX = e.clientX;
      lastT = e.timeStamp;
      el.scrollLeft = startScroll - dx;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      if (!moved) return;
      el.style.cursor = "";
      el.style.userSelect = "";
      // O clique que vem logo depois do arraste não deve acionar botões (ex.: "Add")
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);

      // Se o mouse ficou parado antes de soltar, ignora a velocidade antiga
      if (e.timeStamp - lastT > 100) velocity = 0;

      const positions = snapPositions();
      const startIndex = nearestIndex(positions, startScroll);
      let target = nearestIndex(positions, el.scrollLeft);
      const dragged = el.scrollLeft - startScroll;
      const dir = Math.sign(Math.abs(velocity) > SWIPE_VELOCITY ? velocity : dragged);
      const intentional = Math.abs(dragged) > SWIPE_DISTANCE || Math.abs(velocity) > SWIPE_VELOCITY;

      if (intentional && target === startIndex) target = startIndex + dir;
      target = Math.max(0, Math.min(positions.length - 1, target));
      animateTo(positions[target]);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    };

    const onDragStart = (e: DragEvent) => e.preventDefault();

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, []);
}
