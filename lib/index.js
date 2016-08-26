"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var express = require('express');
var Promise = require('bluebird');
var bodyParser = require('body-parser');
var _ = require('lodash');
var checker_1 = require('./checker');
var responses_1 = require('./responses');
var messages_1 = require('./messages');
__export(require('./responses'));
__export(require('./messages'));
var Tester = (function () {
    function Tester(portToListenOn, addressToSendTo) {
        this.stepMapArray = {};
        this.messagesCallbackFunction = null;
        this.host = addressToSendTo;
        this.port = portToListenOn;
        this.expressApp = express();
        this.expressApp.use(bodyParser.json());
        this.expressApp.get('/v2.6/:id', function (req, res) {
            console.log('requesting', req.params.id);
            var user = {
                first_name: 'user',
                last_name: 'last',
                profile_pic: 'http://none',
                locale: 'en_us',
                timezone: 0,
                gender: 'male',
            };
            res.send(user);
        });
        this.expressApp.get('/v2.6/me/thread_settings', function (req, res) {
            console.log('thread_settings');
            res.send({});
        });
        this.expressApp.post('/v2.6/me/messages', this.messageResponse.bind(this));
        return this;
    }
    Tester.prototype.startListening = function () {
        var _this = this;
        this.expressPromise = new Promise(function (resolve, reject) {
            _this.expressInstance = _this.expressApp.listen(_this.port, function () {
                console.log("listening on " + _this.port);
                resolve();
            });
        });
        return this.expressPromise;
    };
    Tester.prototype.stopListening = function () {
        this.expressInstance.close();
        console.log("stopped listening on " + this.port);
        return Promise.resolve();
    };
    Tester.prototype.checkResponse = function (realResponse, parsedResponse, res) {
        var currentStep = this.stepMapArray[parsedResponse.recipient][0];
        if (currentStep instanceof responses_1.Response) {
            var _savedThis_1 = this;
            this.stepMapArray[parsedResponse.recipient].shift();
            console.log('checking the response...');
            this.promise = this.promise.then(function () { return new Promise(function (resolve) {
                console.log("create expect promise for " + currentStep.constructor.name);
                _savedThis_1.resolveFunction = resolve;
                // console.log('currentStep', currentStep);
                console.log('checking type..');
                if (currentStep.type !== parsedResponse.type) {
                    return _savedThis_1.rejectFunction(new Error("Script does not match response type, got '" + checker_1.ResponseTypes[parsedResponse.type] + "' but expected '" + checker_1.ResponseTypes[currentStep.type] + "'"));
                }
                console.log('checking contents..');
                if (currentStep.check(realResponse)) {
                    console.log('PERFECT');
                    res.sendStatus(200);
                    return resolve();
                }
                res.sendStatus(500);
                return _savedThis_1.rejectFunction(new Error("Script does not match response expected"));
            }); })
                .then(function () {
                console.log('running next step...');
                return _savedThis_1.runNextStep(parsedResponse.recipient);
            });
        }
        else {
            this.rejectFunction(new Error("Script does not have a response, but received one"));
            res.sendStatus(500);
        }
    };
    Tester.prototype.runNextStep = function (recipient) {
        var _this = this;
        var _savedThis = this;
        var nextStep;
        var _loop_1 = function() {
            nextStep = this_1.stepMapArray[recipient].shift();
            if (typeof nextStep === 'undefined') {
                console.log('end of array');
                this_1.promise = this_1.promise.then(function () {
                    console.log('clear');
                    _savedThis.messagesCallbackFunction = null;
                    _savedThis.finalResolveFunction();
                });
                return { value: null };
            }
            console.log('working on:', nextStep.constructor.name);
            if (nextStep instanceof responses_1.Response) {
                var localStep = nextStep;
                console.log("expecting a " + localStep.constructor.name);
                this_1.stepMapArray[recipient].unshift(nextStep);
                return "break";
            }
            else if (nextStep instanceof messages_1.Message) {
                var localStep_1 = nextStep;
                this_1.promise = this_1.promise.then(function () {
                    console.log('sending', localStep_1.constructor.name);
                    return localStep_1.send(_this.host);
                });
            }
            else {
                console.log(nextStep);
                this_1.promise = this_1.promise.then(function () { return Promise.reject(new Error('corrupt script')); });
            }
        };
        var this_1 = this;
        do {
            var state_1 = _loop_1();
            if (typeof state_1 === "object") return state_1.value;
            if (state_1 === "break") break;
        } while (nextStep instanceof messages_1.Message);
        if (nextStep instanceof responses_1.Response) {
            return nextStep;
        }
        return null;
    };
    Tester.prototype.messageResponse = function (req, res) {
        var body = req.body;
        // console.log(util.inspect(body, {depth:null}))
        if (this.messagesCallbackFunction !== null) {
            this.messagesCallbackFunction(req, res);
        }
        else {
            res.sendStatus(200);
        }
    };
    Tester.prototype.runScript = function (script) {
        var _savedThis = this;
        this.stepMapArray[script.userID] = _.clone(script.script);
        if (typeof this.expressPromise === 'undefined') {
            this.startListening();
        }
        this.messagesCallbackFunction = function (req, res) {
            //send api
            var token = req.query.access_token;
            if (typeof token !== 'string') {
                return _savedThis.rejectFunction(new Error('Token must be included on all requests'));
            }
            var body = req.body;
            var parsedResponse = checker_1.checkSendAPI(body);
            // console.log('response:', parsedResponse);
            if (parsedResponse === null || parsedResponse.type === null) {
                res.sendStatus(400);
                return _savedThis.rejectFunction(new Error('Bad response structure'));
            }
            if (parsedResponse.type === checker_1.ResponseTypes.sender_action) {
                res.sendStatus(200);
                return;
            }
            _savedThis.checkResponse(body, parsedResponse, res);
        };
        return this.expressPromise
            .then(function () { return new Promise(function (resolve, reject) {
            _savedThis.promise = Promise.resolve()
                .catch(function (err) {
                console.log('err in script run', err);
            });
            _savedThis.finalResolveFunction = resolve;
            _savedThis.rejectFunction = reject;
            _savedThis.runNextStep(script.userID);
        }); }).finally(function () {
            console.log('script done');
        });
    };
    return Tester;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Tester;
var Script = (function () {
    function Script(user, page) {
        this.seq = 0;
        this.script = [];
        this.userID = user.toString();
        this.pageID = page.toString();
    }
    Script.prototype.sendTextMessage = function (text) {
        this.script.push(new messages_1.TextMessage(this.userID, this.pageID, this.seq++).create(text));
        return this;
    };
    Script.prototype.sendDelay = function (delayMs) {
        this.script.push(new messages_1.DelayMessage(this.userID, this.pageID, 0).create(delayMs));
        return this;
    };
    Script.prototype.sendPostbackMessage = function (payload) {
        this.script.push(new messages_1.PostbackMessage(this.userID, this.pageID, this.seq++).create(payload));
        return this;
    };
    Script.prototype.expectRawResponse = function (responseInstance) {
        this.script.push(responseInstance);
        return this;
    };
    Script.prototype.expectTextResponse = function (text) {
        return this.expectRawResponse(new responses_1.TextResponse([text]));
    };
    Script.prototype.expectTextResponses = function (text) {
        return this.expectRawResponse(new responses_1.TextResponse(text));
    };
    Script.prototype.expectQuickRepliesResponse = function (text, buttonArray) {
        if (text === void 0) { text = []; }
        if (buttonArray === void 0) { buttonArray = []; }
        return this.expectRawResponse(new responses_1.QuickRepliesResponse(text, buttonArray));
    };
    Script.prototype.expectButtonTemplateResponse = function (text, buttonArray) {
        if (text === void 0) { text = []; }
        if (buttonArray === void 0) { buttonArray = []; }
        return this.expectRawResponse(new responses_1.ButtonTemplateResponse(text, buttonArray));
    };
    Script.prototype.expectGenericTemplateResponse = function () {
        return this.expectRawResponse(new responses_1.GenericTemplateResponse());
    };
    return Script;
}());
exports.Script = Script;
