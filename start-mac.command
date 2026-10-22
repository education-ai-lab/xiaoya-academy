#!/bin/bash
# 小芽学园 · macOS 启动脚本
# 双击运行；首次如被系统拦截，请右键 → 打开

cd "$(dirname "$0")" || exit 1
PORT=8123
URL="http://127.0.0.1:$PORT/"

echo ""
echo "  正在启动小芽学园…"
echo ""

if command -v python3 >/dev/null 2>&1; then
  ( sleep 1.2; open "$URL" ) >/dev/null 2>&1 &
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1
  exit 0
fi

if command -v node >/dev/null 2>&1; then
  node server.js
  exit 0
fi

if command -v python >/dev/null 2>&1; then
  ( sleep 1.2; open "$URL" ) >/dev/null 2>&1 &
  python -m SimpleHTTPServer "$PORT" >/dev/null 2>&1
  exit 0
fi

echo "  没有找到 python3 / node，直接用浏览器打开本地文件。"
echo "  提示：建议安装 Python 3 或 Node.js 后使用启动脚本，数据保存更稳定。"
open "index.html"
