/// <reference types="node" />
import type { ReadReqCallback, ReadWriteReqCallback, WriteReqCallback, ReadDeviceInfoReqCallback, ReadStateReqCallback, AddNotificationReqCallback, DeleteNotificationReqCallback, WriteControlReqCallback, ServerSettings, ServerInternals, ServerMetaData, ServerConnection, AdsNotificationTarget } from './types/ads-server';
import { EventEmitter } from 'events';
/**
 * TwinCAT ADS server for Node.js (unofficial). Listens for incoming ADS protocol commands and responds.
 *
 * Copyright (c) 2021 Jussi Isotalo <j.isotalo91@gmail.com>
 *
 * This library is not related to Beckhoff in any way.
 *
 */
export declare class Server extends EventEmitter {
    _internals: ServerInternals;
    /**
     * Connection metadata
     */
    metaData: ServerMetaData;
    /**
     * Connection information
     */
    connection: ServerConnection;
    /**
     * Active server settings
     */
    settings: ServerSettings;
    /**
     * Constructor for Server class
     * Settings to use are provided as parameter
     */
    constructor(settings: Partial<ServerSettings>);
    /**
     * Sets callback function to be called when ADS Read request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onReadReq(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onReadReq(callback: ReadReqCallback): void;
    /**
     * Sets callback function to be called when ADS ReadWrite request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onReadWriteReq(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onReadWriteReq(callback: ReadWriteReqCallback): void;
    /**
     * Sets callback function to be called when ADS Write request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onWriteReq(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onWriteReq(callback: WriteReqCallback): void;
    /**
     * Sets callback function to be called when ADS ReadDeviceInfo request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onReadDeviceInfo(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onReadDeviceInfo(callback: ReadDeviceInfoReqCallback): void;
    /**
     * Sets callback function to be called when ADS ReadState request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onReadState(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onReadState(callback: ReadStateReqCallback): void;
    /**
     * Sets callback function to be called when ADS AddNotification request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onAddNotification(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onAddNotification(callback: AddNotificationReqCallback): void;
    /**
     * Sets callback function to be called when ADS DeleteNotification request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onDeleteNotification(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onDeleteNotification(callback: DeleteNotificationReqCallback): void;
    /**
     * Sets callback function to be called when ADS WriteControl request is received
     *
     * @param callback Callback that is called when request received
     * ```js
     *  onWriteControl(async (req, res) => {
     *    //do something with req object and then respond
     *    await res({..})
     *  })
     * ```
     */
    onWriteControl(callback: WriteControlReqCallback): void;
    /**
     * Sets debugging using debug package on/off.
     * Another way for environment variable DEBUG:
     *  - 0 = no debugging
     *  - 1 = Extended exception stack trace
     *  - 2 = basic debugging (same as $env:DEBUG='ads-server')
     *  - 3 = detailed debugging (same as $env:DEBUG='ads-server,ads-server:details')
     *  - 4 = full debugging (same as $env:DEBUG='ads-server,ads-server:details,ads-server:raw-data')
     *
     * @param {} level 0 = none, 1 = extended stack traces, 2 = basic, 3 = detailed, 4 = detailed + raw data
     */
    setDebugging(level: number): void;
    /**
     * Connects to the target system using settings provided in constructor (or in settings property)
     */
    connect(): Promise<ServerConnection>;
    /**
     * unregisters ADS port from router (if it was registered) and disconnects
     * NOTE: If error is thrown (Promise is rejected) connection is closed anyways
     * but something went wrong during disconnecting and error info is returned
     *
     * @param {} [forceDisconnect=false] - If true, the connection is dropped immediately (default: false)
     */
    disconnect(forceDisconnect?: boolean): Promise<void>;
    /**
     * Disconnects and reconnects again. At the moment does NOT reinitialize subscriptions, everything is lost
     *
     * @param {} [forceDisconnect] - If true, the connection is dropped immediately (default = false)
     *
     */
    reconnect(forceDisconnect?: boolean): Promise<ServerConnection>;
    /**
     * Sends a given data as notification using given notificationHandle and target info.
     */
    sendDeviceNotification(notification: AdsNotificationTarget, data: Buffer): Promise<void>;
    /**
     * Trims the given PLC string until end mark (\0, 0 byte) is found
     * (= removes empty bytes from end of the string)
     * @param {string} plcString String to trim
     *
     * @returns {string} Trimmed string
     */
    trimPlcString(plcString: string): string;
}
export * as ADS from './ads-commons';
