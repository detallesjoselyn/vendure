import {Args, Query, Resolver, Parent} from '@nestjs/graphql';
import {Ctx, ProductVariant,ProductVariantService, RequestContext} from '@vendure/core';
import {TopSellersService} from './use-sku.service';


@Resolver()
export class PublicStockResolvers {

    // @ResolveField('available')
    // @Resolver('ProductVariant')
    // stock(@Ctx() ctx: RequestContext, @Parent() variant: ProductVariant) {
    //     return variant.stockOnHand - variant.stockAllocated - variant.outOfStockThreshold;
    // }
    constructor(private topSellersService: TopSellersService) {}

    @Query()
    async customGetProduct(@Ctx() ctx: RequestContext, @Args() args: any) {
        debugger;
    //return this.productVariantService.findOne(ctx, args.idProductVariant)
    // return this.productVariantService.findByIds(ctx, [args.idProductVariant])
    return this.topSellersService.getVariantsByProductId(ctx,args.idProductVariant);
    
  }

}