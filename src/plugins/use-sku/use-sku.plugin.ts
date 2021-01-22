import gql from 'graphql-tag';
import { VendurePlugin, ProductVariantService, PluginCommonModule, TransactionalConnection } from '@vendure/core';
import {PublicStockResolvers} from './use-sku.resolvers';
import {TopSellersService} from './use-sku.service'

@VendurePlugin({
    imports:[PluginCommonModule],
    providers: [TopSellersService],
    shopApiExtensions: {
        schema: gql`
            extend type Query {
                customGetProduct(idProductVariant: ID): [ProductVariant!]!
            }
        `,
        resolvers: [PublicStockResolvers]
    }
})
export class PublicStockPlugin {}
