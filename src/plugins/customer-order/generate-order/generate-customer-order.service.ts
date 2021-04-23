import {
    Injectable,
} from '@nestjs/common';
import { 
    TransactionalConnection,
    RequestContext, 
    ProductVariant 
} from '@vendure/core';



@Injectable()
export class GenerateCustomerOrderService {
    private relations = ['featuredAsset', 'taxCategory', 'channels'];
    constructor(
        private connection: TransactionalConnection
    ) {}

    /**
     * Search for products from an array of codes
     * @param ctx Session context
     * @param inCodes  Array<String> codes to find in DataBase
     */
    async findProductVariantsBySKU(ctx: RequestContext, inCodes: Array<String>): Promise<Array<ProductVariant>> {
        const qb = this.connection.getRepository<ProductVariant>(ctx,ProductVariant)
        .createQueryBuilder('ProductVariant');
        qb.leftJoin('ProductVariant.product','product')
        if (inCodes.length > 0) {
            qb.andWhere(`ProductVariant.sku IN ( :...skus )`,{skus: inCodes});
        } else {
            qb.andWhere("ProductVariant.sku IN ('-1')");
        }
        qb.andWhere('ProductVariant.deletedAt IS NULL')
        .andWhere('ProductVariant.enabled = true')
        .andWhere('product.deletedAt IS NULL AND product.enabled = true');
        return qb.getMany();
    }


    /**
     * Validate that at least one product has stock to assign
     * @param productVariants Array<ProductVariant>
     */
    isStockAvailable(productVariants: Array<ProductVariant>): Boolean {
        let isAvailable = false;
        productVariants.map((productVariant) => {
            if ((productVariant.stockOnHand - productVariant.stockAllocated) > 0) {
                isAvailable = true
            }
        });
        return isAvailable;
    }
}