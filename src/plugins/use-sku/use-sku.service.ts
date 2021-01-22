import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection, translateDeep, ProductVariant, Translated, ID, ProductVariantService } from '@vendure/core';
import { FindOptionsUtils } from 'typeorm';

@Injectable()
export class TopSellersService {
    constructor(
        private connection: TransactionalConnection,
        private productVariantService: ProductVariantService
    ) {}

    getVariantsByProductId(ctx: RequestContext, productId: ID): Promise<Array<Translated<ProductVariant>>> {
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
        FindOptionsUtils.joinEagerRelations(qb, qb.alias, qb.expressionMap.mainAlias!.metadata);
        return qb
            .innerJoinAndSelect('productVariant.channels', 'channel', 'channel.id = :channelId', {
                channelId: ctx.channelId,
            })
            .innerJoinAndSelect('productVariant.product', 'product', 'product.id = :productId', {
                productId,
            })
            .andWhere('productVariant.deletedAt IS NULL')
            .orderBy('productVariant.id', 'ASC')
            .getMany()
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
}