gcloud functions deploy dialogflowFirebaseFulfillment --entry-point dialogflowFirebaseFulfillment --runtime nodejs12 --trigger-http --allow-unauthenticated \
--update-env-vars PAGE_ACCESS_TOKEN="*****" \ # Facebook page access token
--update-env-vars ENVIRONMENT="***" \ # PROD or DEV
--update-env-vars SECRET="****" # to encript