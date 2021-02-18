import { ActiveOrderResult } from '@vendure/common/lib/generated-shop-types';
import { CancelOrderResolver } from './cancel-order.resolver';
import  gql  from 'graphql-tag';
import { VendurePlugin, PluginCommonModule, OrderService, ShippingMethodService } from "@vendure/core";

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [OrderService,ShippingMethodService],
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                cancelCustomerOrderById(orderId: ID): ActiveOrderResult!
                cancelCustomerOrderByCode(code: String): ActiveOrderResult!
            }
        `,
        resolvers: [CancelOrderResolver]
    }
})
export class CancelOrderCustomerPlugin {
}