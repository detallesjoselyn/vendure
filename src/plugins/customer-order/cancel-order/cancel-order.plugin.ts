import { CancelOrderResolver } from './cancel-order.resolver';
import  gql  from 'graphql-tag';
import { VendurePlugin, PluginCommonModule, OrderService, ShippingMethodService } from "@vendure/core";

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [OrderService,ShippingMethodService],
    shopApiExtensions: {
        schema: gql`
            extend type Mutation {
                cancelCustomerOrder(orderId: ID): ActiveOrderResult!
            }
        `,
        resolvers: [CancelOrderResolver]
    }
})
export class CancelOrderCustomerPlugin {
}