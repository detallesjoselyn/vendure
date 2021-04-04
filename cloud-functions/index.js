// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const handover_protocol = require('./handover-protocol');
const attachment_api = require('./attachment-upload');
const user_profile_api = require('./user-profile');
const welcome_messages = require('./welcom-messages');
const dynamic_menus = require('./dynamic-menus');
const message_api = require('./message-api');

const orders_manager = require('./order');

const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    let originalRequestData = null;
    // console.log(request.body.originalDetectIntentRequest.source.toLowerCase());
    if (request.body.originalDetectIntentRequest.source.toLowerCase() == 'facebook'){
        originalRequestData = request.body.originalDetectIntentRequest.payload.data; 
    }
    request.body.originalDetectIntentRequest.source = 'facebook';

    const agent = new WebhookClient({ request, response });

    const queryResult = request.body.queryResult;

    function welcome(agent) {
        if (originalRequestData && agent.getContext('ending') == null ) {
            agent.add(`👋`); // Menu response it will be send from user-profile
            user_profile_api.getProfile(originalRequestData.sender.id, ((response) => {
                // SOME RESPONSE AFTER END SEN MESSAGE WELCOM
            }));
        }else {
            setMenuWelcomDefault();
        }
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }
    function updateContext(contexts) {
        if (contexts.length > 0) {
            contexts.forEach(context => {
                // console.log(context);
                agent.setContext(context);
            });
        }
    }

    function setMenuWelcomDefault() {
        let items = dynamic_menus.getWelcomMenuElements();
        let messages = welcome_messages.getRamdomMessage(' ').split('||');
        if (originalRequestData) {
            message_api.sendCard(originalRequestData.sender.id,items,() => {});
            // messages.forEach((message,index) => {
            //     if ((messages.length -1) == index ) {
            //         message_api.sendMessage(originalRequestData.sender.id,message, () => {
            //             message_api.sendCard(originalRequestData.sender.id,items,() => {});
            //         })
            //     }else {
            //         message_api.sendMessage(originalRequestData.sender.id,message, () => {});
            //     }
            // });
        } else {
            messages.forEach(message => {
                agent.add(message);
            });
            let cards = [];
            items.forEach(card => {
                let itemCard = new Card(card.title);
                itemCard.setText('');
                itemCard.setImage(card.image_url);
                itemCard.setButton({text: card.title, url: card.buttons[0].title});
                itemCard.setPlatform(agent.FACEBOOK);
                cards.push(itemCard);
            });
            agent.add(cards);
        }
    }
    function setMenuQuestionsFallback() {
        let suggess = new Suggestion("Es todo gracias");
        suggess.addReply_("Preguntas Frecuentes");
        suggess.addReply_("🏠Menú principal");
        suggess.addReply_("Hablar con asesor");
        suggess.title = '😔Lo sentimos, no se algo al respecto sobre tu pregunta, 👇¿Qué deseas hacer?❓💬';
        suggess.setPlatform(agent.FACEBOOK);
        agent.add(suggess);
    }
    function setMenuAskQuestion() {
        let suggess = new Suggestion("Preguntas Frecuentes");
        suggess.addReply_("Gracias 😁");
        suggess.addReply_("🏠Menú principal");
        suggess.addReply_("Hablar con asesor");
        suggess.title = '👇¿Te puedo ayudar en algo más?❓';
        suggess.setPlatform(agent.FACEBOOK);
        agent.add(suggess);
    }
    /** PaymentsMethods Menu  */
    function setMenuPaymentsFallback(){
        let suggess = new Suggestion("Datos Bancarios");
        suggess.addReply_("Dinámica de Pagos");
        suggess.addReply_("Reglas de Pagos");
        suggess.title = '👇Debes escoger una opción del menú 👇';
        suggess.setPlatform(agent.FACEBOOK);
        agent.add(suggess);
    }
    /** PaymentsMethods Menu  */

    /**
     * Intent to response ask with suggestion options by search.
     * @param {Int} agent 
     */
    function askQuestionHandler(agent) {
        let ctx = [];
        ctx.push(agent.getContext('ending'));
        ctx.push(agent.getContext('questionmenu'));
        //updateContext(ctx)

        let question = queryResult.parameters.question;

        if (question.search("busca") >= 0 && question.search("producto") >= 0) {
            agent.add(`Para buscar un producto debes escribir: Buscar producto o desde el menu seleccionar la opción buscar producto 🙌🏾 `);
            setMenuAskQuestion();
            //agent.add({platform: Platforms.FACEBOOK,text:{text: [`Para buscar un producto debes escribir: Buscar producto o desde el menu seleccionar la opción buscar producto 🙌🏾 `]}});
        } else if (question.search("atención") >= 0 || question.search("atencion") >= 0 || question.search("cleinte") >= 0) {
            agent.add(`Nuestro horario de atención a clientes es de Lunes a Viernes de 9am a 7pm, Sábados y Domingos de 9 a 2pm.😁`);
            setMenuAskQuestion();
        } else if (question.search("realizar") >= 0 || question.search("hacer") >= 0 || question.search("pedido") >= 0) {
            agent.add(`Para realizar un pedido debes ir a la opción: Realizar pedido, que lo podrás encontrar en el menú del chatBot, o puedes escribir: quiero hacer un pedido para iniciar el proceso ....😁`);
            setMenuAskQuestion();
        } else if (question.search("método") >= 0 || question.search("metodo") >= 0 || question.search("forma") >= 0 || question.search("pago") >= 0) {
            agent.add(`Puedes realizar tu pago con las siguientes opciones:
    1. Pago en Oxxo al número: XXXX XXXX XXXX a nombre de XXXXXXXXX XXXXXXXXX
    2. Transferencia a la tarjeta XXXX XXXX XXXX
Deberas mandarnos tu comprobante de pago.😁`);
            setMenuAskQuestion();
        } else {
            setMenuQuestionsFallback();
        }
    }

    function askQuestionByID() {
        let questionID = queryResult.parameters.question_id;
        let response = dynamic_menus.getResponseById(questionID);
        if (response) {
            agent.add(response);
            setMenuAskQuestion();
        } else {
            setMenuQuestionsFallback();
        }
    }

    function askQuestionByText() {
        let question = queryResult.queryText;
        let response = dynamic_menus.getResponseByText(question);
        if (response) {
            let messages = response.split('||');
            messages.forEach((message) => {
                agent.add(message);
            });
            setMenuAskQuestion();
        } else {
            setMenuQuestionsFallback();
        }
    }

    /**
     * AgentHandover handler
     */
    function AgentHandover() {
        if (originalRequestData){
            agent.add(`Te transferiré con uno de nuestros asesores 🙋🏻‍♀️`);
            agent.add(`💬 Toma en cuenta que nuestro horario de atención es de Lunes a Viernes de 9:00 am a 5:00 pm.`);
            agent.add(`Trataremos de responder lo más pronto posible 😊`);
            handover_protocol.passThreadControl(originalRequestData.sender.id);
        } else {
            agent.add("Por el momento no te puedo transferir a uno de nuestros asesores, intenta más tarde");

        }

    }

    /**payment-methods-response Intent */
    function getPaymentMethodsResponse(){
        let questionText = queryResult.queryText;

        let search  = dynamic_menus.getPaymentInfo(questionText);
        let messages = search ? search.response.split('||'): [];
        if (search) {
            if (originalRequestData) {
                messages.forEach(message => {
                    agent.add(message);
                });
                attachment_api.sendPaymentMethodsToConversation(originalRequestData.sender.id, search.attachmentId);
            } else {
                if (search.default_response != null || search.default_response != '') {
                    agent.add(search.default_response);
                } else {
                    messages.forEach(message => {
                        agent.add(message);
                    });
                }
            }
        } else {
            setMenuPaymentsFallback();
        }
    }

    /** Set menu questions with quickReplies for intent 'questions menu' */
    function setMenuQuestions() {
        let suggess = null;
        dynamic_menus.getQuestionMenuElements().forEach(element => {
            if (suggess == null){
                suggess = new Suggestion(element.option);
            } else {
                suggess.addReply_(element.option);
            }
        });
        suggess.title = '👇 Elige una de nuestras preguntas frecuentes  ❗❓💬';
        suggess.setPlatform(agent.FACEBOOK);
        agent.add(suggess);
    }
    /** Send messages of order dynamic */
    function setDynamicOrderResponse() {
        dynamic_menus.getDynamicsMessages().forEach(message => {
            agent.add(message);
        });

        let suggess = new Suggestion("📦Hacer pedido");
        suggess.addReply_("No, Gracias 😁");
        suggess.addReply_("🏠Menú principal");
        suggess.addReply_("Hablar con asesor");
        suggess.title = '¿Qué dices, quieres hacer tu pedido? 🛍👇🏽';
        suggess.setPlatform(agent.FACEBOOK);
        agent.add(suggess);
    }

    function order () {
        let messages = dynamic_menus.getOrderMessages();
        messages.forEach((message) => {
            agent.add(message);
        })
    }

    function orderValidate () {
        if ( originalRequestData ) {
            orders_manager.processOrderByText(
                agent,queryResult.queryText,
                originalRequestData.sender.id
            )
        } else {
            agent.add('La recepción de pedidos solo está disponible por Messenger Facebook')
            setMenuAskQuestion()
        }
        
    }

    function orderCancel () {
        if (originalRequestData) {
            orders_manager.cancelCustomerOrder(agent,queryResult.parameters.order_code, originalRequestData.sender.id);
        } else{
            agent.add('La cancelación de pedidos solo está disponible desde Messenger Facebook ');
            setMenuAskQuestion();
        }
    }

    function orderConfirmed () {
        let psid = null;
        if ( originalRequestData ) {
            psid = originalRequestData.sender.id;
        }
        orders_manager.orderAssignStaff(agent,psid);
    }

    function registerEmail (){
        agent.add(`Registraremos tu email: ${queryResult.parameters.email}`);
        // let psid = originalRequestData.sender.id;
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('ask question', askQuestionByText);
    intentMap.set('AgentHandover', AgentHandover);
    intentMap.set('payment-methods-response', getPaymentMethodsResponse);
    intentMap.set('questions menu', setMenuQuestions);
    intentMap.set('order-dynamic', setDynamicOrderResponse);
    intentMap.set('order-validate-list', orderValidate);
    intentMap.set('order-validate-list-fallback', orderValidate);
    intentMap.set('order-cancel', orderCancel);
    intentMap.set('order-confirmed', orderConfirmed);
    intentMap.set('register-email-validate', registerEmail);
    intentMap.set('order', order);

    agent.handleRequest(intentMap);
});