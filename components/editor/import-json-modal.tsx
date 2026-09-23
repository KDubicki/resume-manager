"use client";

import { UploadOutlined } from "@ant-design/icons";
import { App, Button, Modal, Popconfirm, Typography, Upload } from "antd";

import { JsonResumePreview } from "@/components/import/json-resume-preview";
import { downloadSampleJsonResume } from "@/components/import/sample";
import { useJsonResumeFile } from "@/components/import/use-json-resume-file";
import type { ResumeContent } from "@/lib/schemas/resume";

import styles from "./import-json-modal.module.css";

// Editor action: replace the current resume's DATA with an uploaded JSON Resume
// file, keeping the user's template/styling (the merge happens in the editor's
// onImport handler). Rare and destructive, so it lives behind the toolbar's
// overflow menu and a confirm rather than as a permanent editor card.
export function ImportJsonModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (content: ResumeContent) => void;
}) {
  const { message } = App.useApp();
  const { loaded, error, readFile, reset } = useJsonResumeFile();

  const close = () => {
    reset();
    onClose();
  };

  const apply = () => {
    if (!loaded) return;
    onImport(loaded.preview.content);
    message.success("Resume content replaced from the imported file.");
    close();
  };

  return (
    <Modal open={open} onCancel={close} footer={null} title="Replace content from JSON">
      <div className={styles.stack}>
        <Typography.Paragraph type="secondary" className={styles.intro}>
          Replace this resume&apos;s content from a{" "}
          <Typography.Link href="https://jsonresume.org" target="_blank" rel="noreferrer">
            JSON Resume
          </Typography.Link>{" "}
          file. Your template and styling are kept.{" "}
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
          <Button icon={<UploadOutlined />}>
            {loaded ? "Choose a different file" : "Choose JSON file"}
          </Button>
        </Upload>

        {error ? <Typography.Text type="danger">{error}</Typography.Text> : null}

        {loaded ? (
          <>
            <JsonResumePreview preview={loaded.preview} fileName={loaded.fileName} />
            <Popconfirm
              title="Replace current content?"
              description="This overwrites the resume's data. Your template and styling stay."
              okText="Replace"
              cancelText="Cancel"
              onConfirm={apply}
            >
              <Button type="primary" danger>
                Replace current content
              </Button>
            </Popconfirm>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
