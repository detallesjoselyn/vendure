import dotenv from 'dotenv';
import {
    examplePaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    VendureConfig,
} from '@vendure/core'; 
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import path from 'path';
import { GoogleStorageStrategy } from './plugins/google-storage-assets/google-storage-strategy';
import { PublicStockPlugin } from './plugins/use-sku/use-sku.plugin';


// Set up env file
dotenv.config()
export const config: VendureConfig = {
    apiOptions: {
        port: <number | undefined>process.env.PORT || 3000,
        adminApiPath: 'admin-api',
        adminApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },// turn this off for production
        adminApiDebug: true, // turn this off for production
        shopApiPath: 'shop-api',
        shopApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },// turn this off for production
        shopApiDebug: true,// turn this off for production
    },
    authOptions: {
        superadminCredentials: {
            identifier: 'detalles',
            password: 'jocelyn',
        },
        requireVerification: false,
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: true, // turn this off for production
        logging: false,
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        port: 5432,
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        migrations: [path.join(__dirname, '../migrations/*.ts')],
    },
    paymentOptions: {
        paymentMethodHandlers: [examplePaymentHandler],
    },
    customFields: {},
    plugins: [
        AssetServerPlugin.init({
            storageStrategyFactory: () => new GoogleStorageStrategy('detalles-jocelyn-storage'),
            route: 'assets',
            assetUploadDir: '/tmp/vendure/assets',
            port: 3001,
        }),
        DefaultJobQueuePlugin,
        DefaultSearchPlugin,
        PublicStockPlugin,
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            mailboxPort: 3003,
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
        }),
        AdminUiPlugin.init({ port: 3002 }),
    ],
};
