/* tslint:disable:no-non-null-assertion */
import { CustomOrderProcess, mergeConfig, OrderState } from '@vendure/core';
import { createTestEnvironment } from '@vendure/testing';
import path from 'path';

import { initialData } from '../../../e2e-common/e2e-initial-data';
import { TEST_SETUP_TIMEOUT_MS, testConfig } from '../../../e2e-common/test-config';

import { testSuccessfulPaymentMethod } from './fixtures/test-payment-methods';
import { AdminTransition, GetOrder } from './graphql/generated-e2e-admin-types';
import {
    AddItemToOrder,
    AddPaymentToOrder,
    GetNextOrderStates,
    SetCustomerForOrder,
    SetShippingAddress,
    SetShippingMethod,
    TransitionToState,
} from './graphql/generated-e2e-shop-types';
import { ADMIN_TRANSITION_TO_STATE, GET_ORDER } from './graphql/shared-definitions';
import {
    ADD_ITEM_TO_ORDER,
    ADD_PAYMENT,
    GET_NEXT_STATES,
    SET_CUSTOMER,
    SET_SHIPPING_ADDRESS,
    SET_SHIPPING_METHOD,
    TRANSITION_TO_STATE,
} from './graphql/shop-definitions';

type TestOrderState = OrderState | 'ValidatingCustomer';

const initSpy = jest.fn();
const transitionStartSpy = jest.fn();
const transitionEndSpy = jest.fn();
const transitionEndSpy2 = jest.fn();
const transitionErrorSpy = jest.fn();

describe('Order process', () => {
    const VALIDATION_ERROR_MESSAGE = 'Customer must have a company email address';
    const customOrderProcess: CustomOrderProcess<'ValidatingCustomer'> = {
        init(injector) {
            initSpy(injector.getConnection().name);
        },
        transitions: {
            AddingItems: {
                to: ['ValidatingCustomer'],
                mergeStrategy: 'replace',
            },
            ValidatingCustomer: {
                to: ['ArrangingPayment', 'AddingItems'],
            },
        },
        onTransitionStart(fromState, toState, data) {
            transitionStartSpy(fromState, toState, data);
            if (toState === 'ValidatingCustomer') {
                if (!data.order.customer) {
                    return false;
                }
                if (!data.order.customer.emailAddress.includes('@company.com')) {
                    return VALIDATION_ERROR_MESSAGE;
                }
            }
        },
        onTransitionEnd(fromState, toState, data) {
            transitionEndSpy(fromState, toState, data);
        },
        onTransitionError(fromState, toState, message) {
            transitionErrorSpy(fromState, toState, message);
        },
    };

    const customOrderProcess2: CustomOrderProcess<'ValidatingCustomer'> = {
        transitions: {
            ValidatingCustomer: {
                to: ['Cancelled'],
            },
        },
        onTransitionEnd(fromState, toState, data) {
            transitionEndSpy2(fromState, toState, data);
        },
    };

    const { server, adminClient, shopClient } = createTestEnvironment(
        mergeConfig(testConfig, {
            orderOptions: { process: [customOrderProcess as any, customOrderProcess2 as any] },
            paymentOptions: {
                paymentMethodHandlers: [testSuccessfulPaymentMethod],
            },
        }),
    );

    beforeAll(async () => {
        await server.init({
            initialData,
            productsCsvPath: path.join(__dirname, 'fixtures/e2e-products-full.csv'),
            customerCount: 1,
        });
        await adminClient.asSuperAdmin();
    }, TEST_SETUP_TIMEOUT_MS);

    afterAll(async () => {
        await server.destroy();
    });

    describe('CustomOrderProcess', () => {
        it('CustomOrderProcess is injectable', () => {
            expect(initSpy).toHaveBeenCalled();
            expect(initSpy.mock.calls[0][0]).toBe('default');
        });

        it('replaced transition target', async () => {
            await shopClient.query<AddItemToOrder.Mutation, AddItemToOrder.Variables>(ADD_ITEM_TO_ORDER, {
                productVariantId: 'T_1',
                quantity: 1,
            });

            const { nextOrderStates } = await shopClient.query<GetNextOrderStates.Query>(GET_NEXT_STATES);

            expect(nextOrderStates).toEqual(['ValidatingCustomer']);
        });

        it('custom onTransitionStart handler returning false', async () => {
            transitionStartSpy.mockClear();
            transitionEndSpy.mockClear();

            const { transitionOrderToState } = await shopClient.query<
                TransitionToState.Mutation,
                TransitionToState.Variables
            >(TRANSITION_TO_STATE, {
                state: 'ValidatingCustomer',
            });

            expect(transitionStartSpy).toHaveBeenCalledTimes(1);
            expect(transitionEndSpy).not.toHaveBeenCalled();
            expect(transitionStartSpy.mock.calls[0].slice(0, 2)).toEqual([
                'AddingItems',
                'ValidatingCustomer',
            ]);
            expect(transitionOrderToState?.state).toBe('AddingItems');
        });

        it('custom onTransitionStart handler returning error message', async () => {
            transitionStartSpy.mockClear();
            transitionErrorSpy.mockClear();

            await shopClient.query<SetCustomerForOrder.Mutation, SetCustomerForOrder.Variables>(
                SET_CUSTOMER,
                {
                    input: {
                        firstName: 'Joe',
                        lastName: 'Test',
                        emailAddress: 'joetest@gmail.com',
                    },
                },
            );

            try {
                const { transitionOrderToState } = await shopClient.query<
                    TransitionToState.Mutation,
                    TransitionToState.Variables
                >(TRANSITION_TO_STATE, {
                    state: 'ValidatingCustomer',
                });
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain(VALIDATION_ERROR_MESSAGE);
            }

            expect(transitionStartSpy).toHaveBeenCalledTimes(1);
            expect(transitionErrorSpy).toHaveBeenCalledTimes(1);
            expect(transitionEndSpy).not.toHaveBeenCalled();
            expect(transitionErrorSpy.mock.calls[0]).toEqual([
                'AddingItems',
                'ValidatingCustomer',
                VALIDATION_ERROR_MESSAGE,
            ]);
        });

        it('custom onTransitionStart handler allows transition', async () => {
            transitionEndSpy.mockClear();

            await shopClient.query<SetCustomerForOrder.Mutation, SetCustomerForOrder.Variables>(
                SET_CUSTOMER,
                {
                    input: {
                        firstName: 'Joe',
                        lastName: 'Test',
                        emailAddress: 'joetest@company.com',
                    },
                },
            );

            const { transitionOrderToState } = await shopClient.query<
                TransitionToState.Mutation,
                TransitionToState.Variables
            >(TRANSITION_TO_STATE, {
                state: 'ValidatingCustomer',
            });

            expect(transitionEndSpy).toHaveBeenCalledTimes(1);
            expect(transitionEndSpy.mock.calls[0].slice(0, 2)).toEqual(['AddingItems', 'ValidatingCustomer']);
            expect(transitionOrderToState?.state).toBe('ValidatingCustomer');
        });

        it('composes multiple CustomOrderProcesses', async () => {
            transitionEndSpy.mockClear();
            transitionEndSpy2.mockClear();

            const { nextOrderStates } = await shopClient.query<GetNextOrderStates.Query>(GET_NEXT_STATES);

            expect(nextOrderStates).toEqual(['ArrangingPayment', 'AddingItems', 'Cancelled']);

            await shopClient.query<TransitionToState.Mutation, TransitionToState.Variables>(
                TRANSITION_TO_STATE,
                {
                    state: 'AddingItems',
                },
            );

            expect(transitionEndSpy.mock.calls[0].slice(0, 2)).toEqual(['ValidatingCustomer', 'AddingItems']);
            expect(transitionEndSpy2.mock.calls[0].slice(0, 2)).toEqual([
                'ValidatingCustomer',
                'AddingItems',
            ]);
        });
    });

    describe('Admin API transition constraints', () => {
        let order: NonNullable<TransitionToState.Mutation['transitionOrderToState']>;

        beforeAll(async () => {
            await shopClient.asAnonymousUser();
            await shopClient.query<AddItemToOrder.Mutation, AddItemToOrder.Variables>(ADD_ITEM_TO_ORDER, {
                productVariantId: 'T_1',
                quantity: 1,
            });
            await shopClient.query<SetCustomerForOrder.Mutation, SetCustomerForOrder.Variables>(
                SET_CUSTOMER,
                {
                    input: {
                        firstName: 'Su',
                        lastName: 'Test',
                        emailAddress: 'sutest@company.com',
                    },
                },
            );
            await shopClient.query<SetShippingAddress.Mutation, SetShippingAddress.Variables>(
                SET_SHIPPING_ADDRESS,
                {
                    input: {
                        fullName: 'name',
                        streetLine1: '12 the street',
                        city: 'foo',
                        postalCode: '123456',
                        countryCode: 'US',
                        phoneNumber: '4444444',
                    },
                },
            );
            await shopClient.query<SetShippingMethod.Mutation, SetShippingMethod.Variables>(
                SET_SHIPPING_METHOD,
                { id: 'T_1' },
            );
            await shopClient.query<TransitionToState.Mutation, TransitionToState.Variables>(
                TRANSITION_TO_STATE,
                {
                    state: 'ValidatingCustomer',
                },
            );
            const result = await shopClient.query<TransitionToState.Mutation, TransitionToState.Variables>(
                TRANSITION_TO_STATE,
                {
                    state: 'ArrangingPayment',
                },
            );
            order = result.transitionOrderToState!;
        });

        it('cannot manually transition to PaymentAuthorized', async () => {
            expect(order.state).toBe('ArrangingPayment');

            try {
                const { transitionOrderToState } = await adminClient.query<
                    AdminTransition.Mutation,
                    AdminTransition.Variables
                >(ADMIN_TRANSITION_TO_STATE, {
                    id: order.id,
                    state: 'PaymentAuthorized',
                });
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain(
                    'Cannot transition Order to the "PaymentAuthorized" state when the total is not covered by authorized Payments',
                );
            }

            const result = await adminClient.query<GetOrder.Query, GetOrder.Variables>(GET_ORDER, {
                id: order.id,
            });
            expect(result.order?.state).toBe('ArrangingPayment');
        });

        it('cannot manually transition to PaymentSettled', async () => {
            try {
                const { transitionOrderToState } = await adminClient.query<
                    AdminTransition.Mutation,
                    AdminTransition.Variables
                >(ADMIN_TRANSITION_TO_STATE, {
                    id: order.id,
                    state: 'PaymentSettled',
                });
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain(
                    'Cannot transition Order to the "PaymentSettled" state when the total is not covered by settled Payments',
                );
            }

            const result = await adminClient.query<GetOrder.Query, GetOrder.Variables>(GET_ORDER, {
                id: order.id,
            });
            expect(result.order?.state).toBe('ArrangingPayment');
        });

        it('cannot manually transition to Cancelled', async () => {
            const { addPaymentToOrder } = await shopClient.query<
                AddPaymentToOrder.Mutation,
                AddPaymentToOrder.Variables
            >(ADD_PAYMENT, {
                input: {
                    method: testSuccessfulPaymentMethod.code,
                    metadata: {},
                },
            });

            expect(addPaymentToOrder?.state).toBe('PaymentSettled');

            try {
                const { transitionOrderToState } = await adminClient.query<
                    AdminTransition.Mutation,
                    AdminTransition.Variables
                >(ADMIN_TRANSITION_TO_STATE, {
                    id: order.id,
                    state: 'Cancelled',
                });
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain(
                    'Cannot transition Order to the "Cancelled" state unless all OrderItems are cancelled',
                );
            }
            const result = await adminClient.query<GetOrder.Query, GetOrder.Variables>(GET_ORDER, {
                id: order.id,
            });
            expect(result.order?.state).toBe('PaymentSettled');
        });

        it('cannot manually transition to PartiallyDelivered', async () => {
            try {
                const { transitionOrderToState } = await adminClient.query<
                    AdminTransition.Mutation,
                    AdminTransition.Variables
                >(ADMIN_TRANSITION_TO_STATE, {
                    id: order.id,
                    state: 'PartiallyDelivered',
                });
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain(
                    'Cannot transition Order to the "PartiallyDelivered" state unless some OrderItems are delivered',
                );
            }
            const result = await adminClient.query<GetOrder.Query, GetOrder.Variables>(GET_ORDER, {
                id: order.id,
            });
            expect(result.order?.state).toBe('PaymentSettled');
        });

        it('cannot manually transition to PartiallyDelivered', async () => {
            try {
                const { transitionOrderToState } = await adminClient.query<
                    AdminTransition.Mutation,
                    AdminTransition.Variables
                >(ADMIN_TRANSITION_TO_STATE, {
                    id: order.id,
                    state: 'Delivered',
                });
                fail('Should have thrown');
            } catch (e) {
                expect(e.message).toContain(
                    'Cannot transition Order to the "Delivered" state unless all OrderItems are delivered',
                );
            }
            const result = await adminClient.query<GetOrder.Query, GetOrder.Variables>(GET_ORDER, {
                id: order.id,
            });
            expect(result.order?.state).toBe('PaymentSettled');
        });
    });
});
