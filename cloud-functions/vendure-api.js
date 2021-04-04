const api = require('./api');
const axios = require('axios');
const env = require('./env');
const user_profile_facebook = require('./user-profile');


const vendure_url = 'API_' + env.ENVIRONMENT in env ? env['API_' + env.ENVIRONMENT] : 'https://demo.vendure.io';

/** VENDURE ADMIN-API CALLS */
function createCustomer(psid, email, callback) {
    user_profile_facebook.getUserNameFacebook(psid, (response => {
        let mutationGraph = `mutation {
            createCustomer(input: {
              firstName: "${response.first_name}"
              lastName: "${response.last_name}"
              phoneNumber: ""
              emailAddress:"${email}"
              customFields: {psid: "${psid}"}
            }, password: "djbot-${psid}") {
              ...on 
              ErrorResult {
                errorCode
                message
              }
            }
          }
        `;
        let payload = {
            query: mutationGraph,
            variables: {}
        }
        api.POST(vendure_url + '/admin-api', payload, (bodyRes, res, error) => {
            console.log(bodyRes);
            // console.log(res);
            // console.log(error);
            callback(bodyRes);
        });
    }));
}

/** Todo finish login with cookies handle for sessión */
function login(callback) {
    let mutationGraph = `mutation authAdmin{
		login( username: "superadmin",password: "superadmin", rememberMe:true )
	    {
		__typename
	  ... on CurrentUser{
		id
		identifier
		channels	{
		  token
		  id
		  permissions
		}
	  }
	  }
}
    
    `;
    let payload = {
        query: mutationGraph,
        variables: {}
    }
    // console.log(`REQUEST TO: ${vendure_url}`);
    api.POST(vendure_url + '/admin-api', payload, (body, res, error) => {
        // console.log(body);
        console.log('endbody');
        // console.log(res.rawHeaders);
        let session = res.rawHeaders.find(header => header.includes("session"));
        console.log(`Session: ${session}`);
        console.log(`Session: ${session.split(';')[0]}`);
        let sessionSig = res.rawHeaders.find(header => header.includes("session.sig"));
        console.log(`Session: ${sessionSig}`);
        console.log(`Session: ${sessionSig.split(';')[0]}`);
        console.log('endRawHeaders');
        console.log(error);
        callback(body);
    });
}
/** VENDURE QUERIES AND MUTATIONS */

/** END VENDURE QUERIES AND MUTATIONS */

/** END VENDURE ADMIN-API CALLS */

function getPass(psid) {
    return new Buffer.from(`dj-${env.SECRET}-${psid}`).toString('base64').slice(3, 15);
}
function getEmail(psid) {
    return env.ENVIRONMENT == 'PROD' ? `${psid}@detalles.mx` : `${psid}@testing.mx`;
}

/** VENDURE SHOP-API CALLS */

/**
 * 
 * @param {*} psid 
 * @param {object<first_name,last_name>} params 
 * @param {function(response,error,headers)} callback 
 */
function registerShopCustomer(psid, params, callback) {
    let mutation = `mutation(
        $title: String!
        $firstName: String!
        $lastName: String!
        $phoneNumber: String!
        $password: String!
        $emailAddress: String!
    ){
        registerCustomerAccount(
            input: {
                title: $title
                firstName: $firstName
                lastName: $lastName
                phoneNumber: $phoneNumber
                password: $password
                emailAddress: $emailAddress
            }
        ) {
            ... on ErrorResult {
                errorCode
                message
            }
            ... on Success {
                success
            }
            ... on NativeAuthStrategyError {
                errorCode
                message
            }
        }
    }
    `;
    let vars = {
        title: 'dj-account-' + psid,
        firstName: params.first_name,
        lastName: params.last_name,
        phoneNumber: '',
        password: getPass(psid),
        emailAddress: getEmail(psid)
    }
    let payload = {
        query: mutation,
        variables: vars
    }
    return api.postAsync(vendure_url + '/shop-api', payload);
    // return api.postAsync(vendure_url + '/shop-api', payload);

    // api.POST(vendure_url + '/shop-api', payload, (body, res, error) => {
    //     if ('data' in body) {
    //         console.log('SUCCESS');
    //         callback(body, null);
    //     } else {
    //         console.log('ERROR');
    //         callback(null, body);

    //     }
    // });
}

/** */
function loginShopCustomer(psid, callback) {
    let mutation = `mutation($username:String!,$password:String!) {
        login( username: $username,password: $password, rememberMe:false ){
            ...on ErrorResult{
                message
                errorCode
            }
            ... on CurrentUser{
                id
                identifier
                channels	{
                    token
                    id
                    permissions
                }
            }
        }
    }`;

    let vars = {
        username: getEmail(psid),
        password: getPass(psid)
    };

    let payload = {
        query: mutation,
        variables: vars
    }
    return api.postAsync(vendure_url + '/shop-api', payload);
}

/** */
async function findProductsBySku(_skus, credentials, callback) {
    let skus = [];
    try {
        for await (let [index, _sku] of _skus.entries()) {
            // console.log("FIND PRODUCT: " + _sku.code);
            try {
                let q = `query searchProduct($sku: String){
                search(input: {term: $sku}) {
                    items {
                        sku
                        productVariantId
                        productId
                        productName
                    }
                }
            }`;
                let vars = {
                    sku: _sku.code
                }
                let payload = {
                    query: q,
                    variables: vars
                }

                const response = await api.postAsync(vendure_url + '/shop-api', payload, { 'Cookie': credentials });

                if (response.data.data.search.items.length > 0) {
                    let product = response.data.data.search.items.find((item) => {
                        return item.sku == _sku.code
                    });
                    if (product) {
                        skus.push(Object.assign(_skus[index], product));
                    }
                }

            } catch (e) {
                console.log("error in async for");
            }
        }
    } catch (e) {
        console.log(e);
    }
    callback(skus);
}

/** */
async function addItemsToOrder(orders, credentials, callback) {
    try {
        for await (let [index, order] of orders.entries()) {
            // console.log(`AGREGANDO A LA ORDER: ${order.code} cantidad: ${order.require}`);
            let mutation = `mutation {
            addItemToOrder( productVariantId: "${order.productVariantId}",  quantity: ${order.require}  ) {
                ...on Order {
                    code
                    id
                    total
                    state
                    customer{
                        emailAddress
                    }
                    lines {
                        productVariant {
                            id
                            name
                            priceWithTax
                            price
                        }
                        quantity
                        unitPriceWithTax
                        unitPrice
                    }
                }
                ...on ErrorResult {
                    errorCode
                        message
                }
            }
            }`;
            let payload = {
                query: mutation,
                variables: {}
            }
            try {
                const response = await api.postAsync(
                    vendure_url + '/shop-api',
                    payload,
                    { 'Cookie': credentials }
                );
                // verificamos si la respuesta contiene un id, de lo contario errorCode
                if ('id' in response.data.data.addItemToOrder) {
                    orders[index].added = true;
                } else {
                    orders[index].added = false;
                    console.log(response.data.data.addItemToOrder.errorCode);
                }
            } catch (e) {
                console.log("ERROR AL AGREGAR EL PRODUCTO: " + order.code);
                orders[index].added = false;
            }
        }
    } catch (e) {
        console.log("ERROR INESPERADO AL PROCESAR LOS PRODUCTOS");
    }
    callback(orders);
}

/** */
function getActiveOrder(credentials) {
    let q = `query{
        activeOrder{
            id
            code
            total
            totalWithTax
            state
            lines{
                id
                quantity
                unitPriceWithTax
                productVariant {
                    id
                    sku
                    priceWithTax
                    price
                }
                unitPrice
            }
        }
    }`;

    let payload = {
        query: q,
        variables: {}
    }
    return api.postAsync(
        vendure_url + '/shop-api',
        payload,
        { 'Cookie': credentials }
    );
}

/** */
function getNextOrderState(credentials){
    let q = `query {
        nextOrderStates
    }`;

    let payload = {
        query: q,
        variables: {}
    }
    return api.postAsync(
        vendure_url + '/shop-api',
        payload,
        { 'Cookie': credentials }
    );
}

/** */
function setOrderState(credentials,state) {
    let q = `mutation {
        transitionOrderToState(state: "${state}") {
            ...on Order {
                id
                state
            }
            ...on OrderStateTransitionError {
                message
            }
        }
    }`;

    let payload = {
        query: q,
        variables: {}
    }
    return api.postAsync(
        vendure_url + '/shop-api',
        payload,
        { 'Cookie': credentials }
    );
}

/** */
function setPaymentMethodOrder(credentials,paymentMethod){
    let mutation = `mutation {
        addPaymentToOrder(input: {
            method: "${paymentMethod}"
            metadata: {
                data: "somekey"
            }
        }){
            ...on Order {
                id
                code
                state
                total
                totalWithTax
                lines{
                    id
                    quantity
                    unitPriceWithTax
                    productVariant {
                        id
                        sku
                        priceWithTax
                        price
                    }
                    unitPrice
                }
            }
            ...on OrderPaymentStateError {
                errorCode
                message
            }
            ...on PaymentFailedError {
                errorCode
                message
            }
            ...on PaymentDeclinedError {
                message
                errorCode
                paymentErrorMessage
            }
            ...on OrderStateTransitionError{
                message
                fromState
                toState
                errorCode
            }
            ...on NoActiveOrderError {
                message
                errorCode
            }
        }
    }`;

    let payload = {
        query: mutation,
        variables: {}
    }
    return api.postAsync(
        vendure_url + '/shop-api',
        payload,
        { 'Cookie': credentials }
    );
}

/** */
function cancelCustomerOrder(credentials, code) {
    let mutation = `mutation {
        cancelCustomerOrderByCode(code: "${code}"){
          ...on Order{
            id
            code
            state
          }...on ErrorResult{
            errorCode
            message
          }... on NoActiveOrderError {
            errorCode
            
          }
        }
      }
      `;

    let payload = {
        query: mutation,
        variables: {}
    }
    return api.postAsync(
        vendure_url + '/shop-api',
        payload,
        { 'Cookie': credentials }
    );
}

/** */
function getCurrentCustomerLogged(credentials, callback) {
    let q = `query {
        activeCustomer {
            id
            lastName
            emailAddress
        }
    }`;
    let payload = {
        query: q,
        variables: {}
    }
    api.POST(vendure_url + '/shop-api', payload, (body) => {
        if (body.data.activeCustomer) {
            console.log("SUCCESS get current customer logged");
            callback(body.data, null);
        } else {
            console.log("ERROR get current customer");
            callback(null, body);
        }
    }, credentials);
}

/** */
function getCredentials(loginResponse){
    let credentials = '';
    if ('set-cookie' in loginResponse.request.res.headers) {
        loginResponse.request.res.headers['set-cookie'].map((cookie) => {
            credentials += cookie.split(';')[0] + '; ';
        });
    }
    return credentials
}

/** END VENDURE SHOP-API CALLS */

const ORDER_STATES = {
    arrangingPayment: "ArrangingPayment",
    authorized: "PaymentAuthorized",
    settled: "PaymentSettled",
    addingItems: "AddingItems",
    canceled: "Cancelled",
    delivery: "Delivered",
    modifyng: "Modifying"
}

const PAYMENT_METHODS = {
    default: "example-payment-provider"
}





module.exports = {
    createCustomer,
    login,

    // SHOP-API FUCTIONS
    getCredentials,

    registerShopCustomer,
    loginShopCustomer,
    findProductsBySku,
    getCurrentCustomerLogged,
    addItemsToOrder,
    getActiveOrder,
    getNextOrderState,
    setOrderState,
    setPaymentMethodOrder,
    cancelCustomerOrder,
    ORDER_STATES,
    PAYMENT_METHODS
}