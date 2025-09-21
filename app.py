from flask import Flask, send_from_directory
import os

app = Flask(__name__)

# --- Configuration ---
# Set the path to the directory where your Unity WebGL build is located.
# This assumes your Unity build is in a folder named "cannon_game"
# inside the "static" folder of your Flask project.
UNITY_BUILD_DIR = os.path.join(app.root_path, 'static', 'cannon_game')


@app.route('/')
def serve_game_index():
    """
    This is the main route. It serves the 'index.html' file, which is the
    entry point for your Unity game.
    """
    return send_from_directory(UNITY_BUILD_DIR, 'index.html')


@app.route('/<path:filename>')
def serve_game_files(filename):
    """
    This is a "catch-all" route. It handles requests for all other files
    that the index.html needs, such as the files in the 'Build' and
    'TemplateData' folders. Flask will look for them in your UNITY_BUILD_DIR.
    """
    return send_from_directory(UNITY_BUILD_DIR, filename)


if __name__ == '__main__':
    # Make sure to set debug=False for production
    app.run(debug=True)