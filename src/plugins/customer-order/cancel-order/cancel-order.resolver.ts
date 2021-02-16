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
    ) {
    }

    @Transaction()
    @Mutation()
    async cancelCustomerOrder(
        @Ctx() ctx: RequestContext,
        @Args() args: CancelOrderInput,
    ): Promise<ActiveOrderResult | CancelOrderResult> {
        if (!ctx.session) {
            throw new UnauthorizedError();
        }
        let order = await this.orderService.findOne(ctx, args.orderId);
        if (!order) {
            throw new UserInputError('El pedido que intentas cancelar no existe!');
        }
        if (order.state == 'Cancelled') {
            throw new UserInputError('El pedido ya se encuentra cancelado');
        }
        if (order.state != 'PaymentAuthorized') {
            throw new UserInputError('El pedido no se puede cancelar, Estado del pedido: Pago Autorizado');
        }
        if (order.customer?.user?.id != ctx.session.user?.id) {
            throw new UserInputError('No puedes cancelar este pedido, verifica tu número de pedido');
        }

        let orderCanceled = await this.orderService.cancelOrder(ctx, { orderId: order.id });

        return orderCanceled as CancelOrderResult
    }
}