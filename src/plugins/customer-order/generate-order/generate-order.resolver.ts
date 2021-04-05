import { Args, Resolver, Mutation } from '@nestjs/graphql';
import { OrderService, Transaction, 
    Ctx, RequestContext, UnauthorizedError, 
    UserInputError, ProductService, Order, 
    ID, SearchService, SearchResolver } from '@vendure/core';
import { ActiveOrderResult } from '@vendure/common/lib/generated-shop-types'
import {
    CancelOrderResult,
    CancelOrderInput,
} from '@vendure/common/lib/generated-types';

@Resolver('GenerateOrder')
export class GenerateOrderResolver {
    constructor(
        private orderService: OrderService,
    ) {}

    @Transaction()
    @Mutation()
    async generateOrderBySkus(
        @Ctx() ctx: RequestContext,
        @Args() args: any,
        // TODO Change type response by Order
    ): Promise<any> {

        if (!ctx.session) {
            throw new UnauthorizedError();
        }

        // PARSE ITEMS FROM ORDER 
        console.log(args);
        console.log(JSON.parse(args.skus));
        
        
        let order = await this.orderService.create(ctx,ctx.session.user?.id)
        this.orderService.addItemToOrder(ctx, order.id, 10,2)
        //return search
        return order


        // NEXT STEPS: CHANGE STATE AND SET PAYMENT METHOD TO ORDER
    }
}