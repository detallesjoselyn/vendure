import {Args, Query, Resolver, Parent, Mutation} from '@nestjs/graphql';
import {
  Allow,
  Ctx,
  ErrorResultUnion,
  InternalServerError,
  Order,
  OrderService,
  Permission,
  RequestContext,
  SessionService,
  Transaction,
} from '@vendure/core';
import {
  MutationAddItemToOrderArgs,
  UpdateOrderItemsResult
} from '@vendure/common/lib/generated-shop-types';

import {
  TopSellersService
} from './use-sku.service';

declare type MutationAddItemsToOrderArgs = {
  products: Array<MutationAddItemToOrderArgs>
};

@Resolver()
export class PublicStockResolvers {
  constructor(
    private customOrderService: TopSellersService,
    private orderService: OrderService,
    private sessionService: SessionService,
  ) {}

  // @Query()
  // async customGetProduct(@Ctx() ctx: RequestContext, @Args() args: any) {
  //   return this.topSellersService.getVariantsByProductId(ctx,args.skuProducts); 
  // }

  @Transaction()
  @Mutation()
  @Allow(Permission.UpdateOrder, Permission.Owner)
  async addItemsToOrder(
      @Ctx() ctx: RequestContext,
      @Args() args: MutationAddItemsToOrderArgs,
  ): Promise<ErrorResultUnion<UpdateOrderItemsResult, Order>> {
      const order = await this.getOrderFromContext(ctx, true);
      
      return this.customOrderService.addItemToOrder(
          ctx,
          order.id,
          args.products[0].productVariantId,
          args.products[0].quantity,
          (args as any).customFields,
      );
  }

  // Copied from 
  // https://github.com/vendure-ecommerce/vendure/blob/0eaffc1036fb943f9d85953b075728d385a155b5/packages/core/src/api/resolvers/shop/shop-order.resolver.ts
  private async getOrderFromContext(ctx: RequestContext): Promise<Order | undefined>;
    private async getOrderFromContext(ctx: RequestContext, createIfNotExists: true): Promise<Order>;
    private async getOrderFromContext(
        ctx: RequestContext,
        createIfNotExists = false,
    ): Promise<Order | undefined> {
        if (!ctx.session) {
            throw new InternalServerError(`error.no-active-session`);
        }
        let order = ctx.session.activeOrderId
            ? await this.orderService.findOne(ctx, ctx.session.activeOrderId)
            : undefined;
        if (order && order.active === false) {
            // edge case where an inactive order may not have been
            // removed from the session, i.e. the regular process was interrupted
            await this.sessionService.unsetActiveOrder(ctx, ctx.session);
            order = undefined;
        }
        if (!order) {
            if (ctx.activeUserId) {
                order = await this.orderService.getActiveOrderForUser(ctx, ctx.activeUserId);
            }

            if (!order && createIfNotExists) {
                order = await this.orderService.create(ctx, ctx.activeUserId);
            }

            if (order) {
                await this.sessionService.setActiveOrder(ctx, ctx.session, order);
            }
        }
        return order || undefined;
    }

}