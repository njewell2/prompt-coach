import os
import sys

# Allow `from backend.xxx import` when running as `python backend/app.py`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory, jsonify
from backend.routes.analyze import analyze_bp
from backend.routes.execute import execute_bp

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Disable Flask's built-in static serving — we handle it manually
app = Flask(__name__, static_folder=None)

app.register_blueprint(analyze_bp)
app.register_blueprint(execute_bp)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# Serve static assets (JS/CSS/fonts) directly
@app.route("/assets/<path:filename>")
def static_assets(filename):
    return send_from_directory(os.path.join(STATIC_DIR, "assets"), filename)


# SPA fallback — serve index.html for all non-API routes
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index):
        return send_from_directory(STATIC_DIR, "index.html")
    return (
        "<h2>Frontend not built yet.</h2>"
        "<p>Run <code>cd frontend && npm install && npm run build</code></p>",
        200,
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Prompt Coach backend → http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
