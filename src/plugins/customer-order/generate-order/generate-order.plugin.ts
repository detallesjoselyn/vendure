import  gql  from 'graphql-tag';
import { VendurePlugin, PluginCommonModule, OrderService, ShippingMethodService, SearchResolver } from "@vendure/core";
import { GenerateOrderResolver } from './generate-order.resolver';
import { GenerateCustomerOrderService } from './generate-customer-order.service';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [OrderService,ShippingMethodService,GenerateCustomerOrderService],
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