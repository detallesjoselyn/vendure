import dotenv from 'dotenv';
import {
    examplePaymentHandler,
    DefaultJobQueuePlugin,
    VendureConfig,
    DefaultSearchPlugin
} from '@vendure/core'; 
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import path from 'path';
import { GoogleStorageStrategy } from './plugins/google-storage-assets/google-storage-strategy';
import { DJ_PLUGINS } from './plugins';

// Set up env vars file
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

        // ================= TODO: move to environment variable =================
        adminApiDebug: true, // turn this off for production
        shopApiPath: 'shop-api',
        shopApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },// turn this off for production

        // ================= TODO: move to environment variable =================
        shopApiDebug: true,// turn this off for production
    },
    authOptions: {
        superadminCredentials: {
            identifier: 'detalles',
            password: 'jocelyn',
        },
        requireVerification: false,
        // tokenMethod: 'bearer'
    },
    dbConnectionOptions: {
        type: 'postgres',

        // ================= TODO: move to environment variable =================
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
            // ================= TODO: move "detalles-jocelyn-storage" to environment variable =================
            storageStrategyFactory: () => new GoogleStorageStrategy('detalles-jocelyn-storage'),
            route: 'assets',
            assetUploadDir: '/tmp/vendure/assets',
        }),
        DefaultJobQueuePlugin,
        DefaultSearchPlugin,
        ...DJ_PLUGINS,
        // TODO FIX the email setup and add emails to the users
        // EmailPlugin.init({
        //     route: 'mailbox',
        //     devMode: true,
        //     outputPath: path.join(__dirname, '../static/email/test-emails'),
        //     // mailboxPort: <number | undefined>process.env.MAIL_PORT  || 3003,
        //     handlers: defaultEmailHandlers,
        //     templatePath: path.join(__dirname, '../static/email/templates'),
        //     globalTemplateVars: {
        //         // The following variables will change depending on your storefront implementation
        //         fromAddress: '"example" <noreply@example.com>',
        //         verifyEmailAddressUrl: 'http://localhost:8080/verify',
        //         passwordResetUrl: 'http://localhost:8080/password-reset',
        //         changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
        //     },
        // }),
        AdminUiPlugin.init({  route: 'admin', port: <number | undefined>process.env.ADMIN_PORT || 3002 }),
    ],
};
