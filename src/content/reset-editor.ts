const RESET_LABEL = /reset to default code definition/i;
const CONFIRM_LABEL = /^(reset|confirm|ok)$/i;

function labelCandidates(element: Element): string[] {
  return [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("data-tooltip"),
    element.textContent,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/\s+/g, " ").trim());
}

function matchesReset(element: Element): boolean {
  return labelCandidates(element).some((label) => RESET_LABEL.test(label));
}

function matchesConfirm(element: Element): boolean {
  return labelCandidates(element).some((label) => CONFIRM_LABEL.test(label));
}

function isVisible(element: Element): boolean {
  if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) {
    return true;
  }

  // Layout APIs are unavailable in lightweight test doubles.
  if (typeof element.getClientRects !== "function") {
    return true;
  }

  return element.getClientRects().length > 0 || element.offsetParent !== null;
}

export function findResetButton(document: Document): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll(
      'button, [role="button"], div[aria-label], span[aria-label]',
    ),
  );

  for (const candidate of candidates) {
    if (matchesReset(candidate) && isVisible(candidate)) {
      return candidate as HTMLElement;
    }
  }

  return null;
}

export function findConfirmResetButton(document: Document): HTMLElement | null {
  const dialogs = Array.from(
    document.querySelectorAll(
      '[role="dialog"], [role="alertdialog"], .ant-modal, [data-state="open"]',
    ),
  );

  const scopes: Array<ParentNode> = dialogs.length > 0 ? dialogs : [document];

  for (const scope of scopes) {
    const candidates = Array.from(
      scope.querySelectorAll('button, [role="button"]'),
    );
    for (const candidate of candidates) {
      if (matchesConfirm(candidate) && isVisible(candidate)) {
        return candidate as HTMLElement;
      }
    }
  }

  return null;
}

function click(element: HTMLElement): void {
  element.click();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function resetToDefaultCode(
  document: Document,
  options: { timeoutMs?: number; pollMs?: number } = {},
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const pollMs = options.pollMs ?? 200;
  const deadline = Date.now() + timeoutMs;

  let resetButton: HTMLElement | null = null;
  while (Date.now() < deadline) {
    resetButton = findResetButton(document);
    if (resetButton) {
      break;
    }
    await sleep(pollMs);
  }

  if (!resetButton) {
    return false;
  }

  click(resetButton);

  while (Date.now() < deadline) {
    const confirmButton = findConfirmResetButton(document);
    if (confirmButton) {
      click(confirmButton);
      return true;
    }
    await sleep(pollMs);
  }

  // Some layouts reset immediately without a confirm dialog.
  return true;
}
