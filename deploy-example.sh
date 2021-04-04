#Deploying to "google cloud RUN" via gcloud CLI, using containers

# Generating the image
gcloud builds submit --tag eu.gcr.io/detallesjoselyn/ecommerce-detalles .

# Deploying the image
gcloud run deploy ecommerce-detalles \
     --quiet \
     --image "eu.gcr.io/detallesjoselyn/ecommerce-detalles" \
     --region "us-central1" \
     --allow-unauthenticated \
     --add-cloudsql-instances detallesjoselyn:us-central1:detallesjocelynstorage \
     --set-env-vars DATABASE_NAME="XXXXX" \
     --set-env-vars DATABASE_USER="XXXXX" \
     --set-env-vars INSTANCE_CONNECTION_NAME="detallesjoselyn:us-central1:detallesjocelynstorage"\
     --set-env-vars DATABASE_HOST="/cloudsql/detallesjoselyn:us-central1:detallesjocelynstorage" \
     --set-env-vars DATABASE_PASSWORD="XXXX" \
     --platform managed


# NOTE is IMPORTANT to set the database, user name and password in your local