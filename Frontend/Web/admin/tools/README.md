# Photo tool

`cutout.py` turns uploaded jersey photos into rack-ready cut-outs: it removes the background with rembg (AI model `isnet-general-use`), trims, and writes 640 px transparent WebP. The admin app runs it when a jersey is saved.

## Setup (once per computer)

```
python -m venv tools/.venv
tools/.venv/Scripts/python -m pip install "rembg[cpu]==2.0.67"
```

On macOS/Linux use `tools/.venv/bin/python`. The model (~180 MB) downloads to `~/.u2net` the first time it runs.

To use a Python environment somewhere else, set `REMBG_PYTHON` to its `python` executable. To point the admin at a customer app in another folder, set `CUSTOMER_APP_DIR`.
