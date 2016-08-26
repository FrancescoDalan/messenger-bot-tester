"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Promise = require('bluebird');
var rp = require('request-promise');
var Message = (function () {
    function Message(sender, recipient, seq) {
        this.sender = sender;
        this.recipient = recipient;
        this.seq = seq;
    }
    Message.prototype.send = function (host) {
        var payload = {
            url: host,
            qs: {},
            method: 'POST',
            json: this.export(),
        };
        // console.log(util.inspect(payload, {depth: null}));
        return Promise.resolve(rp(payload));
    };
    Message.prototype.export = function () {
        return {
            object: "page",
            entry: [
                {
                    id: this.recipient,
                    time: (new Date).getTime(),
                    messaging: [
                        this.payload,
                    ],
                },
            ],
        };
    };
    return Message;
}());
exports.Message = Message;
var TextMessage = (function (_super) {
    __extends(TextMessage, _super);
    function TextMessage() {
        _super.apply(this, arguments);
    }
    TextMessage.prototype.create = function (text) {
        this.payload = {
            sender: {
                id: this.sender,
            },
            recipient: {
                id: this.recipient,
            },
            timestamp: (new Date).getTime(),
            message: {
                mid: "mid." + 0,
                seq: this.seq,
                text: text,
            },
        };
        return this;
    };
    return TextMessage;
}(Message));
exports.TextMessage = TextMessage;
var DelayMessage = (function (_super) {
    __extends(DelayMessage, _super);
    function DelayMessage() {
        _super.apply(this, arguments);
        this.delay = 0;
    }
    DelayMessage.prototype.create = function (delayMs) {
        this.delay = delayMs;
        return this;
    };
    DelayMessage.prototype.send = function () {
        console.log("delaying " + this.delay + " ms");
        return Promise.delay(this.delay);
    };
    return DelayMessage;
}(Message));
exports.DelayMessage = DelayMessage;
var PostbackMessage = (function (_super) {
    __extends(PostbackMessage, _super);
    function PostbackMessage() {
        _super.apply(this, arguments);
    }
    PostbackMessage.prototype.create = function (payload) {
        this.payload = {
            sender: {
                id: this.sender,
            },
            recipient: {
                id: this.sender,
            },
            timestamp: (new Date).getTime(),
            postback: {
                payload: payload,
            },
        };
        return this;
    };
    return PostbackMessage;
}(Message));
exports.PostbackMessage = PostbackMessage;
