#Deploying to "google cloud RUN" via gcloud CLI, using containers
gcloud builds submit --tag eu.gcr.io/detallesjoselyn/ecommerce-detalles .

gcloud run deploy ecommerce-detalles \
     --quiet \
     --image "eu.gcr.io/detallesjoselyn/ecommerce-detalles" \
     --region "us-central1" \
     --allow-unauthenticated \
     --add-cloudsql-instances detallesjoselyn:us-central1:detallesjocelynstorage \
     --set-env-vars DATABASE_NAME="" \
     --set-env-vars DATABASE_USER="" \
     --set-env-vars INSTANCE_CONNECTION_NAME="detallesjoselyn:us-central1:detallesjocelynstorage"\
     --set-env-vars DATABASE_HOST="/cloudsql/detallesjoselyn:us-central1:detallesjocelynstorage" \
     --set-env-vars DATABASE_PASSWORD="" \
     --platform managed