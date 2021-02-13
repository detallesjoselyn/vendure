import {
    Injectable,
} from '@nestjs/common';
import {
    ErrorResultUnion,
    ID,
    RequestContext,
    TransactionalConnection, 
    translateDeep,
    Order,
    ProductVariant,
    Translated,

    EntityNotFoundError,
    OrderCalculator,
    OrderItem,
    OrderLine,
    OrderModifier,
    OrderService,
    ConfigService,
    Promotion,
    ProductVariantService,
} from '@vendure/core';

import {
    UpdateOrderItemsResult,
} from '@vendure/common/lib/generated-shop-types';
import {
    summate
} from '@vendure/common/lib/shared-utils';

import { ShippingLine } from '@vendure/core/dist/entity/shipping-line/shipping-line.entity';

import {
    InsufficientStockError,
    NegativeQuantityError,
    OrderLimitError,
    OrderModificationError,
} from '@vendure/core/dist/common/error/generated-graphql-shop-errors';


import { FindOptionsUtils } from 'typeorm';

@Injectable()
export class TopSellersService {
    constructor(
        private connection: TransactionalConnection,
        private configService: ConfigService,
        private productVariantService: ProductVariantService,
        private orderCalculator: OrderCalculator,
        private orderModifier: OrderModifier,
        private orderService: OrderService,
    ) {}

    getVariantsByProductId(ctx: RequestContext, skuProducts: String[]): Promise<Array<Translated<ProductVariant>>> {
        const qb = this.connection.getRepository(ctx, ProductVariant).createQueryBuilder('productVariant');
        const relations = [
            'options',
            'facetValues',
            'facetValues.facet',
            'taxCategory',
            'assets',
            'featuredAsset',
        ];
        FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, { relations });
        // tslint:disable-next-line:no-non-null-assertion
        // FindOptionsUtils.joinEagerRelations(qb, qb.alias, qb.expressionMap.mainAlias!.metadata);
         let query = qb
            .innerJoinAndSelect('productVariant.channels', 'channel', 'channel.id = :channelId', {
                channelId: ctx.channelId,
            })
            .innerJoin("productVariant.product", "product");

        query = query
            .andWhere('productVariant.deletedAt IS NULL')
            .andWhere('product.deletedAt IS NULL')
            .orderBy('productVariant.id', 'ASC');

        return query.getMany()
        .then(variants =>
            variants.map(variant => {
                const variantWithPrices = this.productVariantService.applyChannelPriceAndTax(variant, ctx);
                return translateDeep(variantWithPrices, ctx.languageCode, [
                    'options',
                    'facetValues',
                    ['facetValues', 'facet'],
                ]);
            }),
        );
    }

    /**
     * Adds an OrderItem to the Order, either creating a new OrderLine or
     * incrementing an existing one.
     */
    async addItemToOrder(
        ctx: RequestContext,
        orderId: ID,
        productVariantId: ID,
        quantity: number,
        customFields?: { [key: string]: any },
    ): Promise<ErrorResultUnion<UpdateOrderItemsResult, Order>> {
        const order = await this.getOrderOrThrow(ctx, orderId);
        const validationError =
            this.assertQuantityIsPositive(quantity) ||
            this.assertAddingItemsState(order) ||
            this.assertNotOverOrderItemsLimit(order, quantity);
        if (validationError) {
            return validationError;
        }
        const variant = await this.connection.getEntityOrThrow(ctx, ProductVariant, productVariantId);
        const correctedQuantity = await this.orderModifier.constrainQuantityToSaleable(
            ctx,
            variant,
            quantity,
        );
        if (correctedQuantity === 0) {
            return new InsufficientStockError(correctedQuantity, order);
        }
        const orderLine = await this.orderModifier.getOrCreateItemOrderLine(
            ctx,
            order,
            productVariantId,
            customFields,
        );
        await this.orderModifier.updateOrderLineQuantity(
            ctx,
            orderLine,
            orderLine.quantity + correctedQuantity,
            order,
        );
        const quantityWasAdjustedDown = correctedQuantity < quantity;
        const updatedOrder = await this.applyPriceAdjustments(ctx, order, orderLine);
        if (quantityWasAdjustedDown) {
            return new InsufficientStockError(correctedQuantity, updatedOrder);
        } else {
            return updatedOrder;
        }
    }

    private async getOrderOrThrow(ctx: RequestContext, orderId: ID): Promise<Order> {
        const order = await this.orderService.findOne(ctx, orderId);
        if (!order) {
            throw new EntityNotFoundError('Order', orderId);
        }
        return order;
    }

       /**
     * Returns error if quantity is negative.
     */
    private assertQuantityIsPositive(quantity: number) {
        if (quantity < 0) {
            return new NegativeQuantityError();
        }
    }

    /**
     * Returns error if the Order is not in the "AddingItems" state.
     */
    private assertAddingItemsState(order: Order) {
        if (order.state !== 'AddingItems') {
            return new OrderModificationError();
        }
    }

     /**
     * Throws if adding the given quantity would take the total order items over the
     * maximum limit specified in the config.
     */
    private assertNotOverOrderItemsLimit(order: Order, quantityToAdd: number) {
        const currentItemsCount = summate(order.lines, 'quantity');
        const { orderItemsLimit } = this.configService.orderOptions;
        if (orderItemsLimit < currentItemsCount + quantityToAdd) {
            return new OrderLimitError(orderItemsLimit);
        }
    }

    /**
     * Applies promotions, taxes and shipping to the Order.
     */
    private async applyPriceAdjustments(
        ctx: RequestContext,
        order: Order,
        updatedOrderLine?: OrderLine,
    ): Promise<Order> {
        const promotions = await this.connection.getRepository(ctx, Promotion).find({
            where: { enabled: true, deletedAt: null },
            order: { priorityScore: 'ASC' },
        });
        const updatedItems = await this.orderCalculator.applyPriceAdjustments(
            ctx,
            order,
            promotions,
            updatedOrderLine ? [updatedOrderLine] : [],
        );
        await this.connection.getRepository(ctx, Order).save(order, { reload: false });
        await this.connection.getRepository(ctx, OrderItem).save(updatedItems, { reload: false });
        await this.connection.getRepository(ctx, ShippingLine).save(order.shippingLines, { reload: false });
        return order;
    }
}