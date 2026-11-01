"use client";

import { btn } from "./ui";

/** "Select all / none" for the checkboxes named `name` in the enclosing form. */
export default function CheckAllButtons({ name }: { name: string }) {
  function setAll(e: React.MouseEvent<HTMLButtonElement>, checked: boolean) {
    const form = e.currentTarget.closest("form");
    form?.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"]`).forEach((box) => {
      box.checked = checked;
    });
  }
  return (
    <div className="flex gap-space-2xs">
      <button type="button" className={btn.ghost} onClick={(e) => setAll(e, true)}>Select all</button>
      <button type="button" className={btn.ghost} onClick={(e) => setAll(e, false)}>Select none</button>
    </div>
  );
}
