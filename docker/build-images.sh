#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-images.sh
# Builds all sandboxed language runner images for the EdgeCase code executor.
# Run this once on the VPS (or whenever you update a Dockerfile).
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Building EdgeCase runner images..."

docker build -t cp-python "$SCRIPT_DIR/python-runner"
echo "✅  cp-python built"

docker build -t cp-cpp    "$SCRIPT_DIR/cpp-runner"
echo "✅  cp-cpp built"

docker build -t cp-c      "$SCRIPT_DIR/c-runner"
echo "✅  cp-c built"

docker build -t cp-java   "$SCRIPT_DIR/java-runner"
echo "✅  cp-java built"

docker build -t cp-rust   "$SCRIPT_DIR/rust-runner"
echo "✅  cp-rust built"

echo ""
echo "All runner images built successfully!"
echo "Run 'docker images | grep cp-' to verify."
