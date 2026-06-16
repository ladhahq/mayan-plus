#!/usr/bin/env python3
"""
Extract cached files from a LayaAir APK's standalone version cache.

LayaAir's native runtime caches assets with hex-hashed filenames.
The filetable1.txt maps each hash to a content identifier, and
allfiles.txt lists the real filenames in the same order.

Usage:
    python3 extract-cache.py <cache_dir> <output_dir>

Example:
    python3 extract-cache.py assets/cache/stand.alone.version extracted/
"""

import os
import shutil
import sys


def extract(cache_dir, output_dir):
    filetable_path = os.path.join(cache_dir, 'filetable1.txt')
    allfiles_path = os.path.join(cache_dir, 'allfiles.txt')

    if not os.path.exists(filetable_path):
        print(f"Error: {filetable_path} not found")
        sys.exit(1)
    if not os.path.exists(allfiles_path):
        print(f"Error: {allfiles_path} not found")
        sys.exit(1)

    with open(filetable_path) as f:
        ft1 = [l.strip().split() for l in f if l.strip()]

    with open(allfiles_path) as f:
        af = [l.strip() for l in f if l.strip()]

    if len(ft1) != len(af):
        print(f"Warning: filetable1 has {len(ft1)} entries but allfiles has {len(af)}")

    extracted = 0
    missing = 0

    for ft_entry, filename in zip(ft1, af):
        if len(ft_entry) < 1:
            continue
        hash_name = ft_entry[0]
        src = os.path.join(cache_dir, hash_name)
        # Remove leading / from path
        rel_path = filename.lstrip('/')
        dst = os.path.join(output_dir, rel_path)

        if os.path.exists(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            extracted += 1
        else:
            print(f'  MISSING: {hash_name} -> {filename}')
            missing += 1

    print(f'\nExtracted: {extracted}')
    print(f'Missing:   {missing}')
    print(f'Output:    {output_dir}')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    extract(sys.argv[1], sys.argv[2])
