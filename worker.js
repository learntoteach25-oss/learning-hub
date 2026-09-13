name = "learning-hub"
main = "worker.js"
compatibility_date = "2026-09-13"

[assets]
directory = "."
binding = "ASSETS"
run_worker_first = ["/api/*"]
not_found_handling = "404-page"
