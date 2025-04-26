from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="fly_swatter")

@app.route('/')
def serve_index():
    return send_from_directory('fly_swatter', 'fly_swatter.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('fly_swatter', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
