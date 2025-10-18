import io
import os
import shutil
import zipfile
from pathlib import Path
from django.conf import settings

REQUIRED_WEBGL_FILES = ["index.html"]  # Build/ & TemplateData/ typically referenced from index.html

def _is_within_directory(base: Path, target: Path) -> bool:
    try:
        base = base.resolve(strict=False)
        target = target.resolve(strict=False)
        return str(target).startswith(str(base))
    except Exception:
        return False

def safe_extract_zip(zip_file_obj, dest_dir: Path):
    """Safely extract a zip to dest_dir (protect against Zip Slip)."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_file_obj) as zf:
        for member in zf.infolist():
            # Disallow absolute paths and parent traversal
            extracted_path = dest_dir / member.filename
            if not _is_within_directory(dest_dir, extracted_path):
                raise ValueError(f"Unsafe path in zip: {member.filename}")

            if member.is_dir():
                extracted_path.mkdir(parents=True, exist_ok=True)
            else:
                extracted_path.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(member, "r") as src, open(extracted_path, "wb") as out:
                    shutil.copyfileobj(src, out)

def process_unity_webgl_zip(slug: str, django_file) -> str:
    """
    Extract uploaded WebGL zip to MEDIA_ROOT/web_builds/<slug>/.
    Returns the relative media URL to index.html (e.g., '/media/web_builds/slug/index.html').
    Raises ValueError on validation errors.
    """
    # Where the build will live
    dest = Path(settings.MEDIA_ROOT) / "web_builds" / slug

    # Clean any previous build folder for this slug
    if dest.exists():
        shutil.rmtree(dest)

    # Read the uploaded file into memory (or stream to temp if large)
    # django_file is an InMemoryUploadedFile or TemporaryUploadedFile
    django_file.seek(0)
    file_bytes = django_file.read()
    bio = io.BytesIO(file_bytes)

    # Extract safely
    safe_extract_zip(bio, dest)

    # Validate: need index.html
    index_path = dest / "index.html"
    if not index_path.exists():
        # Sometimes Unity zips the folder itself; try to find index.html deep once
        candidates = list(dest.rglob("index.html"))
        if candidates:
            # Move the inner folder up to dest (flatten)
            inner_root = candidates[0].parent
            # Move all children of inner_root up one level
            for p in inner_root.iterdir():
                target = dest / p.name
                if target.exists():
                    if target.is_dir():
                        shutil.rmtree(target)
                    else:
                        target.unlink()
                shutil.move(str(p), str(target))
            # Remove now-empty inner structure
            # (Try multiple rmdirs from inner_root upward until fail)
            try:
                while True:
                    inner_root.rmdir()
                    inner_root = inner_root.parent
                    if inner_root == dest:
                        break
            except Exception:
                pass
            if not (dest / "index.html").exists():
                raise ValueError("Unity WebGL zip did not contain a usable index.html at the root.")
        else:
            raise ValueError("Unity WebGL zip is missing index.html.")

    # Optional: verify Build/ and TemplateData/ exist (Unity default names)
    # We won't hard-fail because projects can customize paths.
    # build_dir = dest / "Build"
    # template_dir = dest / "TemplateData"

    # Return media URL for index.html
    return f"{settings.MEDIA_URL}web_builds/{slug}/index.html"
