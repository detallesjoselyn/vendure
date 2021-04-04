#Script to DOCKERIZE locally before deploy to google RUN

# Stops existing containers
docker stop detallesDockerized
# Removes existing containers
docker rm detallesDockerized
# Builds new image
docker build -t detalles-docker .
# Run image
docker run --name detallesDockerized -p 3000:3000  detalles-docker