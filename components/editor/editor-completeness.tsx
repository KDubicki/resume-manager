"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { CompletenessMeter } from "@/components/completeness-meter";
import { computeCompleteness } from "@/lib/ats/completeness";
import type { ResumeContent } from "@/lib/schemas/resume";

// Live completeness readout at the top of the editor. Isolated as its own leaf
// so subscribing to the whole form (useWatch with no name) only re-renders this
// meter on each keystroke, not the entire editor tree.
export function EditorCompleteness() {
  const { control } = useFormContext<ResumeContent>();
  const values = useWatch({ control }) as ResumeContent;
  const { percent, items } = computeCompleteness(values);
  return <CompletenessMeter percent={percent} items={items} />;
}
