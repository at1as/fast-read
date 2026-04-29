PORT ?= 8000

.PHONY: help run serve check

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make run     Start a local server on http://localhost:$(PORT)' \
		'  make serve   Alias for make run' \
		'  make check   Validate the JavaScript entrypoint'

run:
	python3 -m http.server $(PORT)

serve: run

check:
	node --check app.js
