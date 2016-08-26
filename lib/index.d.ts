import * as express from 'express';
import * as Promise from 'bluebird';
import { Response } from './responses';
import { Message } from './messages';
import * as sendTypes from './send-types';
export * from './responses';
export * from './messages';
export default class Tester {
    protected expressApp: express.Application;
    protected host: string;
    protected port: number;
    private expressInstance;
    expressPromise: any;
    promise: any;
    private finalResolveFunction;
    private resolveFunction;
    private rejectFunction;
    private stepMapArray;
    private messagesCallbackFunction;
    constructor(portToListenOn: number, addressToSendTo: string);
    startListening(): Promise<void>;
    stopListening(): Promise<void>;
    private checkResponse(realResponse, parsedResponse, res);
    private runNextStep(recipient);
    private messageResponse(req, res);
    runScript(script: Script): Promise<void>;
}
export declare class Script {
    private seq;
    userID: string;
    pageID: string;
    script: Array<Message | Response>;
    constructor(user: string, page: string);
    sendTextMessage(text: string): this;
    sendDelay(delayMs: number): this;
    sendPostbackMessage(payload: string): this;
    expectRawResponse(responseInstance: Response): this;
    expectTextResponse(text: string): this;
    expectTextResponses(text: Array<string>): this;
    expectQuickRepliesResponse(text?: Array<string>, buttonArray?: Array<sendTypes.Button>): this;
    expectButtonTemplateResponse(text?: Array<string>, buttonArray?: Array<sendTypes.Button>): this;
    expectGenericTemplateResponse(): this;
}
