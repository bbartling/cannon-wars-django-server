# Use an official Python runtime as a parent image.
# python:3.9-slim is a good choice for being lightweight.
FROM python:3.9-slim

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the requirements file into the container.
# This is done first to leverage Docker's layer caching.
COPY requirements.txt .

# Install the Python dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application's code (app.py, static folder, etc.)
# into the container at /app.
COPY . .

# Expose port 5000, which is the default port for Flask's development server.
EXPOSE 5000

# Run the application using the built-in Flask development server.
# The --host=0.0.0.0 flag makes it accessible from outside the container.
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0"]

