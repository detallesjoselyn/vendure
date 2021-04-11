import { GenerateCustomerOrderService } from './generate-customer-order.service';
import { Args, Resolver, Mutation } from '@nestjs/graphql';
import {
    OrderService, Transaction,
    Ctx, RequestContext, UnauthorizedError,
    UserInputError, Order,
    ID, ProductVariant, InternalServerError, IllegalOperationError, ErrorResultUnion
} from '@vendure/core';
import { ActiveOrderResult } from '@vendure/common/lib/generated-shop-types'

@Resolver('GenerateOrder')
export class GenerateOrderResolver {

    constructor(
        private orderService: OrderService,
        private generateCustomerOrderService: GenerateCustomerOrderService
    ) { }

    @Transaction()
    @Mutation()
    async generateOrderBySkus(
        @Ctx() ctx: RequestContext,
        @Args() args: any,
    ): Promise<ActiveOrderResult | any> {

        if (!ctx.session) {
            throw new UnauthorizedError();
        }

        let jsonOrder = JSON.parse(args.skus);
        let skus: Array<String> = []
        jsonOrder.map((sku: any) => {
            skus.push(sku.code);
        });
        if (skus.length == 0) {
            throw new UserInputError('Solicitud incorrecta!');
        }
        let search: Array<ProductVariant>;
        try {
            search = await this.generateCustomerOrderService.findProductVariantsBySKU(ctx, skus);
        } catch (e) {
            search = [];
        }

        let order: Order | any | undefined;

        if (search.length > 0 && this.generateCustomerOrderService.isStockAvailable(search)) {
            try{
                order = await this.orderService.getActiveOrderForUser(ctx, ctx.session.user?.id as ID);
                if (!order) {
                    order = await this.orderService.create(ctx,ctx.session.user?.id as ID);
                }
            }catch(e){console.log("Error to get or create order");}
            if (!order) {
                throw new InternalServerError("Ocurrió un error al intentar genear el pedido");
            }

            try{
                for await (let[index, productVariant] of search.entries()) {
                    let jsonValue = jsonOrder.find((order: any) => order.code == productVariant.sku)
                    // se verifica que se pueda asignar el producto, de lo contrario omitimos agregar el producto a la orden
                    if (jsonValue && (productVariant.stockOnHand - productVariant.stockAllocated) > 0) {
                        try{
                            let addItemResult: ErrorResultUnion<Order, any> = await this.orderService.addItemToOrder(ctx, order?.id as ID, productVariant.id, jsonValue.quantity);
                            if (addItemResult instanceof Order){
                                order = addItemResult;
                            } else if(addItemResult.order){;
                                order = addItemResult.order
                            }
                        }catch(e){/** error to add products to order beacuse insuficient stock  */}
                    }
                };
            }catch(e) {console.log(`ERROR ADDING ITEMS TO ORDER, detail: ${e}`);}

            if (order) {
                if (order.lines.length > 0) {
                    try {
                        let transitionResult = await this.orderService.transitionToState(ctx, order.id, 'ArrangingPayment');
                    } catch (e) {
                        try{
                            await this.orderService.cancelOrder(ctx,{orderId: order.id,reason: "ERROR on transi¡tion state to ArrangingPayment" });
                        } catch(e){}
                        throw new IllegalOperationError("Ocurrio un error al procesar el pedido");
                    }

                    try {
                        let paymentMethods = await this.orderService.getEligiblePaymentMethods(ctx, order.id);
                        if (paymentMethods.length > 0 && paymentMethods[0].isEligible) {
                            order = await this.orderService.addPaymentToOrder(
                                ctx,
                                order.id,
                                { method: paymentMethods[0].code, metadata: { data: "PAYMENT METHOD FOR DJ-BOT" } });
                        } else {
                            order = await this.orderService.cancelOrder(ctx,{orderId: order.id,reason: "CANCEL ORDER, NO PAYMENT TYPE AVAILABLE"});
                        }
                    } catch (e) {console.log("Error on transition order state or set paymentMethod");}
                    if (order.state != 'PaymentAuthorized' || order.lines.length == 0) {
                        throw new IllegalOperationError("Ocurrio un error al autorizar el pedido");
                    }
                }
            }

        } else {
            if (search.length == 0){
                throw new IllegalOperationError("No encontramos los productos solicitados");
            } else {
                throw new IllegalOperationError("Stock insuficiente para generar pedido");
            }
        }
        return order
    }
}