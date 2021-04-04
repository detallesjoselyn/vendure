# detalles-jocelyn-ecommerce

This project was generated with [`@vendure/create`](https://github.com/vendure-ecommerce/vendure/tree/master/packages/create).

## Directory structure

* `/src` contains the source code of your Vendure server. All your custom code and plugins should reside here.
* `/static` contains static (non-code) files such as assets (e.g. uploaded images) and email templates.
* * `/cloud-function` contains cloud function (NOT RELATED WITH VENDURE)

## Development

```
yarn start-dev
# or
npm run start-dev
```

Will start the Vendure server and [worker](https://www.vendure.io/docs/developer-guide/vendure-worker/) processes from
the `src` directory.

## Build

```
yarn build
# or
npm run build
```

Will compile the TypeScript sources into the `/dist` directory.

## Deploy Vendure to Google Cloud
To deploy we could use the scripts of package.json:

- Dockerize and start a docker container, for local environment, 
```
  npm run deploy:local
```  

- Generate docker image and deploy it to Google RUN
  - For development environment
  ```
    npm run deploy:dev
  ```  
  - For prod environment
  ```
    npm run deploy:prod
  ```

NOTES: 
- Is necessary to create the files: `deploy-dev.sh` and `deploy-prod.sh`, we could use as basis the file `deploy-example.sh` .
- Is necessary to login on gcloud using a [service-account](https://cloud.google.com/iam/docs/service-accounts) file called `DetallesJocelyn-someKey.json`, it should be generated in the [service-account](https://console.cloud.google.com/iam-admin/serviceaccounts?project=detallesjoselyn) console.

- Use [gcloud run deploy](https://cloud.google.com/sdk/gcloud/reference/run/deploy), for deploying vendure environments.

## Ecosystem

- [Cloud functions console](https://console.cloud.google.com/functions/list?project=detallesjoselyn&tab=metrics): Where Google functions environments are hosted.
- [Databases instance console](https://console.cloud.google.com/sql/instances/detallesjocelynstorage/databases?project=detallesjoselyn): Where are described the databases, To access Locally is necessary to setup IP permision.

- [Cloud Storage console](https://console.cloud.google.com/storage/browser?project=detallesjoselyn&prefix=), where are the file storages.

- [Google Run console](https://console.cloud.google.com/run?project=detallesjoselyn): where the environments of Vendure are hosted.
  - Vendure environments
    - [Prod](https://ecommerce-detalles-prod-6rdirhirma-uc.a.run.app/admin/login) admin
    - [Dev](https://ecommerce-detalles-6rdirhirma-uc.a.run.app/) admin

- Dialog Flow: Machine learning chatbot.
  - [Production](https://dialogflow.cloud.google.com/#/agent/detallesjoselyn/intents)
  - [Dev](https://dialogflow.cloud.google.com/#/agent/djtesting-a60c8/intents)

- Bots de facebook, 
  - [DJ BOT](https://developers.facebook.com/apps/364540234693715/roles/roles/), for Prod
  - [DJ BOT DEV](https://developers.facebook.com/apps/3659662714146173/roles/roles/), for development

- [Billing page](https://console.cloud.google.com/billing/019849-092957-2443F1?project=detallesjoselyn), billing of report page
- [Monitoring](https://console.cloud.google.com/monitoring?project=detallesjoselyn&timeDomain=1h), Performance monitoring to evaluate scalation of services.
# References
- [gcloud functions deploy](https://cloud.google.com/sdk/gcloud/reference/functions/deploy): for deploying google functions.

- [gcloud run deploy](https://cloud.google.com/sdk/gcloud/reference/run/deploy), for deploying vendure environments.

- Vendure UPGRADE
  - [Vendure upgrade guide](https://www.vendure.io/docs/developer-guide/updating-vendure/).
  - [Vendure CHANGELOG](https://github.com/vendure-ecommerce/vendure/blob/master/CHANGELOG.md).
  - [Scripts example](https://gist.github.com/michaelbromley/5edc01ab07b3f2101cc1f0cb3b60e598): database upgrade from 18.15 to V1.0 and Migration utils (To update settings)
  - [Vendure real world proyect](https://github.com/vendure-ecommerce/real-world-vendure/), repo with the latest changes in vendure
- 


## Migrations (VENDURE DOC)

[Migrations](https://www.vendure.io/docs/developer-guide/migrations/) allow safe updates to the database schema.

The following npm scripts can be used to generate migrations:

```
yarn migration:generate [name]
# or
npm run migration:generate [name]
```

run any pending migrations that have been generated:

```
yarn migration:run
# or
npm run migration:run
```

and revert the most recently-applied migration:

```
yarn migration:revert
# or
npm run migration:revert
```