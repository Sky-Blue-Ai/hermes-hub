"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "./icons";

export default function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="cmd">
      <code>{command}</code>
      <button onClick={copy} aria-label="复制命令">
        {copied ? <IconCheck /> : <IconCopy />} {copied ? "已复制" : "复制"}
      </button>
    </div>
  );
}