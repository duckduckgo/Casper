#!/usr/bin/env bash
# Post-zip integrity check for dist/casper.zip.
# Catches the class of bug where build tooling re-encodes binary assets
# (e.g. fonts double-encoded) — gscan and `yarn zip` exit 0 in that case.
set -euo pipefail

ZIP="${1:-dist/casper.zip}"

if [ ! -f "$ZIP" ]; then
    echo "verify-bundle: $ZIP not found" >&2
    exit 1
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

unzip -q "$ZIP" -d "$WORK"

fail=0

# 1. No zero-byte files anywhere in the bundle.
while IFS= read -r f; do
    echo "FAIL zero-byte file: ${f#$WORK/}"
    fail=1
done < <(find "$WORK" -type f -size 0)

# 2. woff2 must start with `wOF2` (77 4f 46 32).
while IFS= read -r f; do
    magic=$(head -c 4 "$f" | xxd -p)
    if [ "$magic" != "774f4632" ]; then
        echo "FAIL woff2 magic on ${f#$WORK/}: got $magic, want 774f4632"
        fail=1
    fi
done < <(find "$WORK" -type f -name '*.woff2')

# 3. woff must start with `wOFF` (77 4f 46 46).
while IFS= read -r f; do
    magic=$(head -c 4 "$f" | xxd -p)
    if [ "$magic" != "774f4646" ]; then
        echo "FAIL woff magic on ${f#$WORK/}: got $magic, want 774f4646"
        fail=1
    fi
done < <(find "$WORK" -type f -name '*.woff')

# 4. PNG must start with the 8-byte PNG signature.
while IFS= read -r f; do
    magic=$(head -c 8 "$f" | xxd -p)
    if [ "$magic" != "89504e470d0a1a0a" ]; then
        echo "FAIL png magic on ${f#$WORK/}: got $magic"
        fail=1
    fi
done < <(find "$WORK" -type f -name '*.png')

# 5. JPG/JPEG must start with FFD8FF.
while IFS= read -r f; do
    magic=$(head -c 3 "$f" | xxd -p)
    if [ "$magic" != "ffd8ff" ]; then
        echo "FAIL jpg magic on ${f#$WORK/}: got $magic"
        fail=1
    fi
done < <(find "$WORK" -type f \( -name '*.jpg' -o -name '*.jpeg' \))

# 6. Required theme entry points are present.
for required in package.json default.hbs index.hbs assets/built/screen.css; do
    if [ ! -f "$WORK/$required" ]; then
        echo "FAIL missing required file: $required"
        fail=1
    fi
done

if [ "$fail" -ne 0 ]; then
    echo "verify-bundle: integrity check failed" >&2
    exit 1
fi

echo "verify-bundle: OK ($(find "$WORK" -type f | wc -l) files checked)"
