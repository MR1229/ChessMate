import os
from flask import Flask

from chess.game import Game
from routes.api import api_bp, set_game


def create_app():
    # Locate dist folder relative to workspace
    dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
    
    app = Flask(__name__, static_folder=dist_dir, static_url_path="")

    game = Game()
    set_game(game)

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix="/api")

    # Serve the main index.html file for any non-API routes
    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    @app.errorhandler(404)
    def page_not_found(e):
        # Fallback to index.html for SPA client side routing
        return app.send_static_file("index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)
