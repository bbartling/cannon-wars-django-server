from flask import Flask, render_template

app = Flask(__name__)


# Home page
@app.route("/")
def home():
    return render_template("home.html")


# Fly Swatter game page
@app.route("/fly_swatter_game")
def fly_swatter():
    return render_template("fly_swatter_game.html")


# Fly Swatter Tutorial page (new!)
@app.route("/fly_swatter_tutorial")
def fly_swatter_tutorial():
    return render_template("fly_swatter_tutorial.html")


# Pop The Lock game page
@app.route("/pop_the_lock_game")
def pop_the_lock():
    """Render the Pop the Lock WASM game."""
    return render_template("pop_the_lock_game.html")


# Pop The Lock tutorial page
@app.route("/pop_the_lock_tutorial")
def pop_the_lock_tutorial():
    """Render the Pop the Lock tutorial explaining how the game works."""
    return render_template("pop_the_lock_tutorial.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
