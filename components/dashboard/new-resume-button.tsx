"use client";

import { App, Button, Input, Modal, Segmented } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createResume } from "@/lib/actions/resume";
import type { ResumeTemplate } from "@/lib/schemas/resume";

export function NewResumeButton() {
  const router = useRouter();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Untitled resume");
  const [template, setTemplate] = useState<ResumeTemplate>("classic");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { id } = await createResume(title.trim() || "Untitled resume", template);
      router.push(`/resume/${id}`);
    } catch {
      message.error("Couldn't create a resume — try again.");
      setCreating(false);
    }
  };

  return (
    <>
      <Button type="primary" size="large" onClick={() => setOpen(true)}>
        New resume
      </Button>
      <Modal
        title="New resume"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void handleCreate()}
        okText="Create"
        confirmLoading={creating}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resume title"
            aria-label="Resume title"
          />
          <Segmented
            block
            value={template}
            onChange={(value) => setTemplate(value as ResumeTemplate)}
            options={[
              { label: "Classic (1-column, ATS-safe)", value: "classic" },
              { label: "Sidebar (2-column)", value: "sidebar" },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
