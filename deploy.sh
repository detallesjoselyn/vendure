#Deploying to "google cloud RUN" via gcloud CLI, using containers
gcloud builds submit --tag eu.gcr.io/detallesjoselyn/ecommerce-detalles .

gcloud run deploy ecommerce-detalles \
     --quiet \
     --image "eu.gcr.io/detallesjoselyn/ecommerce-detalles" \
     --region "us-central1" \
     --allow-unauthenticated \
     --memory=1G --add-cloudsql-instances detallesjoselyn:us-west4:venduredetallesjoselyn \
  --update-env-vars INSTANCE_CONNECTION_NAME="detallesjoselyn:us-west1:detallesvendure2" --platform managed
