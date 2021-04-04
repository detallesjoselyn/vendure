# Google Cloud functions
Scripts that will are called by Dialog Flow Bot, and are calling to vendure.
## deploy
- Use gcloud functions deploy
- [gcloud functions deploy](https://cloud.google.com/sdk/gcloud/reference/functions/deploy): for deploying google functions.
- Test the curl:
```c
curl -X POST -H 'Content-Type: application/json' -d '{"responseId":"97f82706-a185-43ea-82a2-b76e454a0f7e-4b8539db","queryResult":{"queryText":"hola","action":"input.welcome","parameters":{},"allRequiredParamsPresent":true,"outputContexts":[{"name":"projects/detallesjoselyn/locations/global/agent/sessions/34864b35-3467-7625-98cb-7e22d6c51112/contexts/defaultwelcomeintent-followup","lifespanCount":1},{"name":"projects/detallesjoselyn/locations/global/agent/sessions/34864b35-3467-7625-98cb-7e22d6c51112/contexts/questionmenu","lifespanCount":1},{"name":"projects/detallesjoselyn/locations/global/agent/sessions/34864b35-3467-7625-98cb-7e22d6c51112/contexts/agenthandover","lifespanCount":1},{"name":"projects/detallesjoselyn/locations/global/agent/sessions/34864b35-3467-7625-98cb-7e22d6c51112/contexts/payment_methods","lifespanCount":1},{"name":"projects/detallesjoselyn/locations/global/agent/sessions/34864b35-3467-7625-98cb-7e22d6c51112/contexts/order-menu","lifespanCount":1},{"name":"projects/detallesjoselyn/locations/global/agent/sessions/34864b35-3467-7625-98cb-7e22d6c51112/contexts/_system_counters_","parameters":{"no-input":0,"no-match":0}}],"intent":{"name":"projects/detallesjoselyn/locations/global/agent/intents/2af59afd-4c62-494e-9746-60d016f44cce","displayName":"Default Welcome Intent"},"intentDetectionConfidence":1,"languageCode":"es","sentimentAnalysisResult":{"queryTextSentiment":{"score":0.1,"magnitude":0.1}}},"originalDetectIntentRequest":{"source":"DIALOGFLOW_CONSOLE","payload":{}},"session":"projects/detallesjoselyn/locations/global/agent/sessions/34864b35-3467-7625-98cb-7e22d6c51112"}' https://us-central1-detallesjoselyn.cloudfunctions.net/dialogflowFirebaseFulfillmentProd
```

NOTE: Use the correct url of the curl result of the gcloud function.


## TODO
- Migrate to TS
- Migrate to node 12