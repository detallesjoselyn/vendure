import { Args, Resolver, Mutation } from '@nestjs/graphql';
import { OrderService, Transaction, Ctx, RequestContext, UnauthorizedError, UserInputError } from '@vendure/core';
import { ActiveOrderResult } from '@vendure/common/lib/generated-shop-types'
import {
    CancelOrderResult,
    CancelOrderInput
} from '@vendure/common/lib/generated-types';

@Resolver()
export class CancelOrderResolver {
    constructor(
        private orderService: OrderService
    ) {}

    @Transaction()
    @Mutation()
    async cancelCustomerOrderById(
        @Ctx() ctx: RequestContext,
        @Args() args: CancelOrderInput,
    ): Promise<ActiveOrderResult | CancelOrderResult> {
        if (!ctx.session) {
            throw new UnauthorizedError();
        }
        return this.cancelOrder(ctx,args);
    }

    @Transaction()
    @Mutation()
    async cancelCustomerOrderByCode(
        @Ctx() ctx: RequestContext,
        @Args() args: any ,
    ): Promise<ActiveOrderResult | CancelOrderResult> {
        if (!ctx.session) {
            throw new UnauthorizedError();
        }
        return this.cancelOrder(ctx,args);
    }

    private async cancelOrder(ctx: RequestContext, args: any | CancelOrderInput){
        console.log(args);
        if (!args.code && !args.orderId) {
            throw new UserInputError('Es necesario especificar el código o id del pedido!');
        }
        let order = args.orderId ? await this.orderService.findOne(ctx, args.orderId) :
            await this.orderService.findOneByCode(ctx, args.code);
        if (!order) {
            throw new UserInputError('El pedido que intentas cancelar no existe!');
        }
        if (order.state == 'Cancelled') {
            throw new UserInputError('El pedido ya se encuentra cancelado');
        }
        if (order.state != 'PaymentAuthorized' &&  order.state != 'AddingItems' ) {
            throw new UserInputError(
                "El pedido no se puede cancelar Estado: " + order.state
            );
        }
        if (order.customer?.user?.id != ctx.session?.user?.id) {
            throw new UserInputError('No puedes cancelar este pedido debido a que no lo tienes asignado');
        }

        let orderCanceled = await this.orderService.cancelOrder(
            ctx,
            { orderId: order.id, reason: 'Customer cancelation from facebook chatboot' }
        );

        return orderCanceled as CancelOrderResult
    }
}