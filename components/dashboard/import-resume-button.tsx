"use client";

import { UploadOutlined } from "@ant-design/icons";
import { App, Button, Input, Modal, Segmented, Typography, Upload } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { JsonResumePreview } from "@/components/import/json-resume-preview";
import { downloadSampleJsonResume } from "@/components/import/sample";
import { useJsonResumeFile } from "@/components/import/use-json-resume-file";
import { importResumeFromJson } from "@/lib/actions/resume";
import { TEMPLATE_OPTIONS, type ResumeTemplate } from "@/lib/schemas/resume";

// Dashboard action: import a JSON Resume (jsonresume.org) file into a brand-new
// resume. Non-destructive — nothing existing is touched.
export function ImportResumeButton() {
  const router = useRouter();
  const { message } = App.useApp();
  const { loaded, error, readFile, reset } = useJsonResumeFile();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<ResumeTemplate>("classic");
  const [importing, setImporting] = useState(false);

  const close = () => {
    setOpen(false);
    setImporting(false);
    reset();
    setTitle("");
  };

  const handleImport = async () => {
    if (!loaded) return;
    setImporting(true);
    const result = await importResumeFromJson(
      title.trim() || loaded.preview.content.contact.fullName,
      loaded.raw,
      template,
    );
    if (result.ok) {
      router.push(`/resume/${result.id}`);
    } else {
      message.error(result.error);
      setImporting(false);
    }
  };

  return (
    <>
      <Button size="large" icon={<UploadOutlined />} onClick={() => setOpen(true)}>
        Import JSON
      </Button>
      <Modal
        title="Import from JSON Resume"
        open={open}
        onCancel={close}
        onOk={() => void handleImport()}
        okText="Import"
        okButtonProps={{ disabled: !loaded }}
        confirmLoading={importing}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            Upload a{" "}
            <Typography.Link href="https://jsonresume.org" target="_blank" rel="noreferrer">
              JSON Resume
            </Typography.Link>{" "}
            file. Not sure of the format?{" "}
            <Typography.Link onClick={downloadSampleJsonResume}>Download a sample</Typography.Link>.
          </Typography.Paragraph>

          <Upload
            accept=".json,application/json"
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              void readFile(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>{loaded ? "Choose a different file" : "Choose JSON file"}</Button>
          </Upload>

          {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}

          {loaded ? (
            <>
              <JsonResumePreview preview={loaded.preview} fileName={loaded.fileName} />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={loaded.preview.content.contact.fullName || "Resume title"}
                aria-label="Resume title"
              />
              <Segmented
                block
                value={template}
                onChange={(value) => setTemplate(value as ResumeTemplate)}
                options={TEMPLATE_OPTIONS}
              />
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
