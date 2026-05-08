import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, send_from_directory, jsonify
from backend.routes.analyze import analyze_bp
from backend.routes.execute import execute_bp
from backend.routes.auth import auth_bp
from backend.routes.progress import progress_bp
from backend.db import init_db

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("SECRET_KEY", "prompt-coach-dev-secret-change-in-prod")

app.register_blueprint(analyze_bp)
app.register_blueprint(execute_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(progress_bp)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/assets/<path:filename>")
def static_assets(filename):
    return send_from_directory(os.path.join(STATIC_DIR, "assets"), filename)


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
    init_db()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Prompt Coach backend → http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
