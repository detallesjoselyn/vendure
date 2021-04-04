/**
 * Handover protocol api facebook
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 */
'use strict';

//import API helper
const api = require('./api');
const env = require('./env');

function passThreadControl (userPsid) {

  let payload = {
    recipient: {
      id: userPsid
    },
    target_app_id: env.TARGET_APP_ID
  };

  api.call('/pass_thread_control', payload, () => {});
}

function takeThreadControl (userPsid) {
  let payload = {
    recipient: {
      id: userPsid
    }
  };

  api.call('/take_thread_control', payload, () => {});
}

module.exports = {
  passThreadControl,
  takeThreadControl
};