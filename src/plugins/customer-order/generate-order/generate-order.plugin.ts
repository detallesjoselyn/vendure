import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import  gql  from 'graphql-tag';
import { VendurePlugin, PluginCommonModule, OrderService, ShippingMethodService, SearchResolver } from "@vendure/core";
import { GenerateOrderResolver } from './generate-order.resolver';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [OrderService,ShippingMethodService],
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                generateOrderBySkus(skus: [String]!): Order!
            }
        `,
        resolvers: [GenerateOrderResolver]
    }
})
export class GenerateOrderCustomerPlugin {
}