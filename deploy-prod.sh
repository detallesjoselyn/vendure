#Deploying to "google cloud RUN" via gcloud CLI, using containers
gcloud builds submit --tag eu.gcr.io/detallesjoselyn/ecommerce-detalles-prod .

gcloud run deploy ecommerce-detalles-prod \
     --quiet \
     --image "eu.gcr.io/detallesjoselyn/ecommerce-detalles-prod" \
     --region "us-central1" \
     --allow-unauthenticated \
     --add-cloudsql-instances detallesjoselyn:us-central1:detallesjocelynstorage \
  --update-env-vars INSTANCE_CONNECTION_NAME="detallesjoselyn:us-central1:detallesjocelynstorage" --platform managed
