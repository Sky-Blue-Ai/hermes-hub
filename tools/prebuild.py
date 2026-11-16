#!/usr/bin/env python3.11
"""构建前置：采集 + 门禁。

CI 上没有 ~/.hermes、也没有 hermes CLI，所以 CI 里只跑门禁（校验仓库里已提交的
app/data/hermes.json），采集只在本机做。用 HERMES_HUB_SKIP_COLLECT=1 跳过采集。
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def run(args: list[str]) -> int:
    print(f"$ {' '.join(args)}", flush=True)
    return subprocess.run(args, cwd=ROOT).returncode


def main() -> int:
    if os.environ.get("HERMES_HUB_SKIP_COLLECT") == "1":
        print("[skip] HERMES_HUB_SKIP_COLLECT=1：使用仓库内已提交的 hermes.json", flush=True)
    else:
        code = run([sys.executable, "tools/collect.py"])
        if code != 0:
            return code
    return run([sys.executable, "tools/check_content.py"])


if __name__ == "__main__":
    sys.exit(main())