'use strict';
const env = require('./env'),
request = require('request');

const axios = require('axios');
const GRAPH_URL = 'https://graph.facebook.com/me';

function call (path, payload, callback, graph_url = 'https://graph.facebook.com/me', queryParams) {
  const access_token = process.env.PAGE_ACCESS_TOKEN || env.PAGE_ACCESS_TOKEN;

  if (!path) {
    console.error('No endpoint specified on Messenger send!');
    return;
  } else if (!access_token || !graph_url) {
    console.error('No Page access token or graph API url configured!');
    return;
  }
  if (queryParams) {
      queryParams = Object.assign(queryParams,{'access_token': access_token});
  } else {
      queryParams = {'access_token': access_token};
  }
  request({
    uri: graph_url + path,
    qs: queryParams,
    method: 'POST',
    json: payload,
  }, (error, response, body) => {
    if (error && response.statusCode >= 400) {
        console.error('Error: ' + error);        
    }
    callback(body);
  });
};

/**
 * Async request with axios.
 */
function callAsync(path, payload, graph_url , queryParams){
    if (graph_url == null) {
        graph_url = GRAPH_URL;
    }
    const access_token = process.env.PAGE_ACCESS_TOKEN || env.PAGE_ACCESS_TOKEN;

  if (!path) {
    console.error('No endpoint specified on Messenger send!');
    return;
  } else if (!access_token || !graph_url) {
    console.error('No Page access token or graph API url configured!');
    return;
  }
  if (queryParams) {
      queryParams = Object.assign(queryParams,{'access_token': access_token});
  } else {
      queryParams = {'access_token': access_token};
  }
  return axios.post(graph_url + path,payload,{params: queryParams});
}

function get (path, payload, callback, graph_url = 'https://graph.facebook.com/me', queryParams) {
  const access_token = process.env.PAGE_ACCESS_TOKEN || env.PAGE_ACCESS_TOKEN;
//   const graph_url = 'https://graph.facebook.com/me';

  if (!path) {
    console.error('No endpoint specified on Messenger send!');
    return;
  } else if (!access_token || !graph_url) {
    console.error('No Page access token or graph API url configured!');
    return;
  }
  if (queryParams) {
      queryParams = Object.assign(queryParams,{'access_token': access_token});
  } else {
      queryParams = {'access_token': access_token};
  }
  request({
    uri: graph_url + path,
    qs: queryParams,
    method: 'GET',
    json: payload,
  }, (error, response, body) => {
    if (error && response.statusCode >= 400) {
        console.error('Error: ' + error); 
    }
    callback(body);
  });
};

/**
 * get async funtion as promise axios
 */
function getAsync(path,graph_url = 'https://graph.facebook.com/me',queryParams){
    const access_token = process.env.PAGE_ACCESS_TOKEN || env.PAGE_ACCESS_TOKEN;
    if (queryParams) {
        queryParams = Object.assign(queryParams,{'access_token': access_token});
    } else {
        queryParams = {'access_token': access_token};
    }
    return axios.get(graph_url + path,{params:queryParams});
}

/** */
function postAsync(url,payload,_headers){
    let headers = {};
    if(_headers) {
        headers = Object.assign(_headers,headers);
    }
    return axios.create({
        // baseUrl: url,
        headers: headers
    }).post(url,payload);
}

function POST(url,payload,callback,_headers){
    // console.log(_headers);
    let headers = {};
    if (_headers) {
        if (_headers.session && _headers.sessionSig) {
            headers['cookie'] = _headers.session.split(';')[0] + '; ' + _headers.sessionSig.split(';')[0]
        }
    }
    request({
        uri: url,
        method: 'POST',
        json: payload,
        headers
    },(error,response,body) => {
        if (_headers){
            // console.log("REQUEST WITH HEADERS");
            // console.log(Object.getOwnPropertyNames(response));
            // console.log(Object.getOwnPropertyNames(response.req));
            // console.log(response.req);
            // console.log("REQUEST WITH HEADERS");
        }
        callback(body,response,error);
    })
}

module.exports = {
  call,
  get,
  POST,
  callAsync,
  getAsync,
  postAsync
};