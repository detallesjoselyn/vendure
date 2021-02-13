import gql from 'graphql-tag';
import { VendurePlugin, ProductVariantService, PluginCommonModule, TransactionalConnection } from '@vendure/core';
import {PublicStockResolvers} from './use-sku.resolvers';
import {TopSellersService} from './use-sku.service'

@VendurePlugin({
    imports:[PluginCommonModule],
    providers: [TopSellersService],
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                addItemsToOrder(products: []): UpdateOrderItemsResult!
            }
        `,
        resolvers: [PublicStockResolvers]
    }
})
export class PublicStockPlugin {}

// addItemsToOrder(productVariantId: ID!, quantity: Int!): UpdateOrderItemsResult!