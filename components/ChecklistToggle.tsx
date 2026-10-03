import { useEffect, useState } from "react";
export function ChecklistToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (done: boolean) => Promise<unknown>;
}) {
  const [value, setValue] = useState(checked),
    [pending, setPending] = useState(false);
  useEffect(() => setValue(checked), [checked]);
  return (
    <input
      type="checkbox"
      checked={value}
      disabled={pending}
      onChange={(e) => {
        const done = e.target.checked;
        setValue(done);
        setPending(true);
        void onChange(done)
          .catch(() => setValue(!done))
          .finally(() => setPending(false));
      }}
    />
  );
}
