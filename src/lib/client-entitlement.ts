import {
  EMPTY_DEMO_ENTITLEMENT,
  type DemoEntitlement,
} from "@/lib/pricing";

export const ENTITLEMENT_STORAGE_KEY = "grok-console-entitlement-v1";
export const ENTITLEMENT_EVENT = "grok-entitlement-change";

function normalizeEntitlement(value: unknown): DemoEntitlement {
  if (!value || typeof value !== "object") return EMPTY_DEMO_ENTITLEMENT;
  const candidate = value as Partial<DemoEntitlement>;

  return {
    credits:
      typeof candidate.credits === "number" && Number.isFinite(candidate.credits)
        ? Math.max(0, candidate.credits)
        : 0,
    freeQuestionsUsed:
      typeof candidate.freeQuestionsUsed === "number" &&
      Number.isFinite(candidate.freeQuestionsUsed)
        ? Math.max(0, Math.floor(candidate.freeQuestionsUsed))
        : 0,
    activePack:
      candidate.activePack === "builder" ||
      candidate.activePack === "pro" ||
      candidate.activePack === "studio"
        ? candidate.activePack
        : null,
    updatedAt:
      typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
  };
}

export function readDemoEntitlement() {
  if (typeof window === "undefined") return EMPTY_DEMO_ENTITLEMENT;

  try {
    const stored = window.localStorage.getItem(ENTITLEMENT_STORAGE_KEY);
    return stored
      ? normalizeEntitlement(JSON.parse(stored) as unknown)
      : EMPTY_DEMO_ENTITLEMENT;
  } catch {
    window.localStorage.removeItem(ENTITLEMENT_STORAGE_KEY);
    return EMPTY_DEMO_ENTITLEMENT;
  }
}

export function writeDemoEntitlement(entitlement: DemoEntitlement) {
  if (typeof window === "undefined") return;
  const normalized = normalizeEntitlement(entitlement);
  window.localStorage.setItem(
    ENTITLEMENT_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(
    new CustomEvent<DemoEntitlement>(ENTITLEMENT_EVENT, {
      detail: normalized,
    }),
  );
}

export function resetDemoEntitlement() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ENTITLEMENT_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent<DemoEntitlement>(ENTITLEMENT_EVENT, {
      detail: EMPTY_DEMO_ENTITLEMENT,
    }),
  );
}
