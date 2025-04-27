from flask import Flask, render_template

app = Flask(__name__)

# Home page
@app.route('/')
def home():
    return render_template('home.html')

# Fly Swatter game page
@app.route('/fly_swatter_game')
def fly_swatter():
    return render_template('fly_swatter_game.html')

# Fly Swatter Tutorial page (new!)
@app.route('/fly_swatter_tutorial')
def fly_swatter_tutorial():
    return render_template('fly_swatter_tutorial.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
