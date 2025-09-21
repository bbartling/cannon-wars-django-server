# WASM Fun



## Builds with Docker
```bash
docker-compose down
docker compose up -d --build
docker compose logs -f web

# Get wasms only
docker compose run --rm emsdk

# Dev: just rebuild WASMs into ./static without rebuilding the image
docker compose run --rm emsdk


docker system prune -a
```