PORT ?= 8000
DEMO_DIR := demo
DEMO_VIDEO := $(DEMO_DIR)/demo.mov
DEMO_GIF := $(DEMO_DIR)/preview.gif

.PHONY: help run serve check demo-gif

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make run     Start a local server on http://localhost:$(PORT)' \
		'  make serve   Alias for make run' \
		'  make check   Validate the JavaScript entrypoint' \
		'  make demo-gif Generate demo/preview.gif from demo/demo.mov'

run:
	python3 -m http.server $(PORT)

serve: run

check:
	node --check app.js

demo-gif:
	ffmpeg -y -ss 0 -t 6 -i $(DEMO_VIDEO) \
		-vf "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
		-loop 0 $(DEMO_GIF)
