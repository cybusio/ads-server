"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADS = exports.Server = void 0;
/*
https://github.com/jisotalo/ads-server
ads-server.ts

Copyright (c) 2021 Jussi Isotalo <j.isotalo91@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
const PACKAGE_NAME = 'ads-server';
const ADS = __importStar(require("./ads-commons"));
const net_1 = __importDefault(require("net"));
const long_1 = __importDefault(require("long"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const events_1 = require("events");
//-------------- Debugs --------------
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default(PACKAGE_NAME);
const debugD = debug_1.default(`${PACKAGE_NAME}:details`);
const debugIO = debug_1.default(`${PACKAGE_NAME}:raw-data`);
/**
 * TwinCAT ADS server for Node.js (unofficial). Listens for incoming ADS protocol commands and responds.
 *
 * Copyright (c) 2021 Jussi Isotalo <j.isotalo91@gmail.com>
 *
 * This library is not related to Beckhoff in any way.
 *
 */
class Server extends events_1.EventEmitter {
    /**
     * Constructor for Server class
     * Settings to use are provided as parameter
     */
    constructor(settings) {
        //Call EventEmitter constructor
        super();
        this._internals = {
            debugLevel: 0,
            //Socket connection and data receiving
            receiveDataBuffer: Buffer.alloc(0),
            socket: null,
            //Ads communication
            nextInvokeId: 0,
            amsTcpCallback: null,
            socketConnectionLostHandler: null,
            socketErrorHandler: null,
            reconnectionTimer: null,
            requestCallbacks: {}
        };
        /**
         * Connection metadata
         */
        this.metaData = {
            routerState: {
                state: 0,
                stateStr: ''
            }
        };
        /**
         * Connection information
         */
        this.connection = {
            connected: false,
            localAmsNetId: '',
            localAdsPort: 0
        };
        /**
         * Active server settings
         */
        this.settings = {
            routerTcpPort: 48898,
            routerAddress: 'localhost',
            localAddress: '',
            localTcpPort: 0,
            localAmsNetId: '',
            localAdsPort: 0,
            timeoutDelay: 2000,
            hideConsoleWarnings: false,
            autoReconnect: true,
            reconnectInterval: 2000
        };
        //Taking the default settings and then adding the given ones
        this.settings = {
            ...this.settings,
            ...settings
        };
    }
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
    onReadReq(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.Read, callback);
    }
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
    onReadWriteReq(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.ReadWrite, callback);
    }
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
    onWriteReq(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.Write, callback);
    }
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
    onReadDeviceInfo(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.ReadDeviceInfo, callback);
    }
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
    onReadState(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.ReadState, callback);
    }
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
    onAddNotification(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.AddNotification, callback);
    }
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
    onDeleteNotification(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.DeleteNotification, callback);
    }
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
    onWriteControl(callback) {
        _setRequestCallback.call(this, ADS.ADS_COMMAND.WriteControl, callback);
    }
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
    setDebugging(level) {
        debug(`setDebugging(): Debug level set to ${level}`);
        debug.enabled = false;
        debugD.enabled = false;
        debugIO.enabled = false;
        this._internals.debugLevel = level;
        if (level === 0) {
            //See ServerException
        }
        else if (level === 2) {
            debug.enabled = true;
        }
        else if (level === 3) {
            debug.enabled = true;
            debugD.enabled = true;
        }
        else if (level === 4) {
            debug.enabled = true;
            debugD.enabled = true;
            debugIO.enabled = true;
        }
    }
    /**
     * Connects to the target system using settings provided in constructor (or in settings property)
     */
    connect() {
        return new Promise(async (resolve, reject) => {
            if (this._internals.socket !== null) {
                debug(`connect(): Socket already assigned`);
                return reject(new ServerException(this, 'connect()', 'Connection is already opened. Close the connection first using disconnect()'));
            }
            debug(`connect(): Starting to connect ${this.settings.routerAddress}:${this.settings.routerTcpPort}`);
            //Creating a socket and setting it up
            const socket = new net_1.default.Socket();
            socket.setNoDelay(true); //Sends data without delay
            //----- Connecting error events -----
            //Listening error event during connection
            socket.once('error', (err) => {
                debug('connect(): Socket connect failed: %O', err);
                //Remove all events from socket
                socket.removeAllListeners();
                reject(new ServerException(this, 'connect()', `Connection to ${this.settings.routerAddress}:${this.settings.routerTcpPort} failed (socket error ${err.message})`, err));
            });
            //Listening close event during connection
            socket.once('close', (hadError) => {
                debug(`connect(): Socket closed by remote, connection failed`);
                //Remove all events from socket
                socket.removeAllListeners();
                reject(new ServerException(this, 'connect()', `Connection to ${this.settings.routerAddress}:${this.settings.routerTcpPort} failed - socket closed by remote (hadError = ${hadError})`));
            });
            //Listening end event during connection
            socket.once('end', () => {
                debug(`connect(): Socket connection ended by remote, connection failed.`);
                //Remove all events from socket
                socket.removeAllListeners();
                if (this.settings.localAdsPort <= 0)
                    reject(new ServerException(this, 'connect()', `Connection to ${this.settings.routerAddress}:${this.settings.routerTcpPort} failed - socket ended by remote (is the given local ADS port ${this.settings.localAdsPort} already in use?)`));
                else
                    reject(new ServerException(this, 'connect()', `Connection to ${this.settings.routerAddress}:${this.settings.routerTcpPort} failed - socket ended by remote`));
            });
            //Listening timeout event during connection
            socket.once('timeout', () => {
                debug(`connect(): Socket timeout`);
                //No more timeout needed
                socket.setTimeout(0);
                socket.destroy();
                //Remove all events from socket
                socket.removeAllListeners();
                reject(new ServerException(this, 'connect()', `Connection to ${this.settings.routerAddress}:${this.settings.routerTcpPort} failed (timeout) - No response from router in ${this.settings.timeoutDelay} ms`));
            });
            //----- Connecting error events end -----
            //Listening for connect event
            socket.once('connect', async () => {
                debug(`connect(): Socket connection established to ${this.settings.routerAddress}:${this.settings.routerTcpPort}`);
                //No more timeout needed
                socket.setTimeout(0);
                this._internals.socket = socket;
                this.connection.connected = true;
                //Try to register an ADS port
                try {
                    const res = await _registerAdsPort.call(this);
                    const amsPortData = res.amsTcp.data;
                    this.connection.connected = true;
                    this.connection.localAmsNetId = amsPortData.localAmsNetId;
                    this.connection.localAdsPort = amsPortData.localAdsPort;
                    debug(`connect(): ADS port registered from router. We are ${this.connection.localAmsNetId}:${this.connection.localAdsPort}`);
                }
                catch (err) {
                    socket.destroy();
                    //Remove all events from socket
                    socket.removeAllListeners();
                    return reject(new ServerException(this, 'connect()', `Registering ADS port from router failed`, err));
                }
                //Listening connection lost events
                this._internals.socketConnectionLostHandler = _onConnectionLost.bind(this, true);
                socket.on('close', this._internals.socketConnectionLostHandler);
                socket.on('end', this._internals.socketConnectionLostHandler);
                //TODO: If socket error happens, should something to be done? Now probably close/end is called afterwards.
                this._internals.socketErrorHandler = (err) => _console.call(this, `WARNING: Socket connection error: ${JSON.stringify(err)}`);
                socket.on('error', this._internals.socketErrorHandler);
                debug(`connect(): Connected - listening for incoming requests at ${this.connection.localAmsNetId}:${this.connection.localAdsPort}`);
                //We are connected to the target
                this.emit('connect', this.connection);
                resolve(this.connection);
            });
            //Listening data event
            socket.on('data', (data) => {
                _socketReceive.call(this, data);
            });
            //Timeout only during connecting, other timeouts are handled elsewhere
            socket.setTimeout(this.settings.timeoutDelay);
            //Finally, connect
            try {
                socket.connect({
                    port: this.settings.routerTcpPort,
                    host: this.settings.routerAddress,
                    localPort: (this.settings.localTcpPort ? this.settings.localTcpPort : null),
                    localAddress: (this.settings.localAddress ? this.settings.localAddress : null),
                });
            }
            catch (err) {
                reject(new ServerException(this, 'connect()', `Opening socket connection to ${this.settings.routerAddress}:${this.settings.routerTcpPort} failed`, err));
            }
        });
    }
    /**
     * unregisters ADS port from router (if it was registered) and disconnects
     * NOTE: If error is thrown (Promise is rejected) connection is closed anyways
     * but something went wrong during disconnecting and error info is returned
     *
     * @param {} [forceDisconnect=false] - If true, the connection is dropped immediately (default: false)
     */
    disconnect(forceDisconnect = false) {
        return new Promise(async (resolve, reject) => {
            var _a, _b, _c, _d, _e, _f;
            debug(`disconnect(): Starting to close connection (force: ${forceDisconnect})`);
            if (this._internals.socketConnectionLostHandler) {
                (_a = this._internals.socket) === null || _a === void 0 ? void 0 : _a.off('close', this._internals.socketConnectionLostHandler);
                (_b = this._internals.socket) === null || _b === void 0 ? void 0 : _b.off('end', this._internals.socketConnectionLostHandler);
            }
            if (this._internals.socketErrorHandler) {
                (_c = this._internals.socket) === null || _c === void 0 ? void 0 : _c.off('error', this._internals.socketErrorHandler);
            }
            //If forced, then just destroy the socket
            if (forceDisconnect) {
                (_d = this._internals.socket) === null || _d === void 0 ? void 0 : _d.removeAllListeners();
                (_e = this._internals.socket) === null || _e === void 0 ? void 0 : _e.destroy();
                this.connection.connected = false;
                this.connection.localAdsPort = 0;
                this._internals.socket = null;
                this.emit('disconnect');
                return resolve();
            }
            try {
                await _unregisterAdsPort.call(this);
                //Done
                this.connection.connected = false;
                this.connection.localAdsPort = 0;
                if (this._internals.socket != null) {
                    this._internals.socket.removeAllListeners();
                    this._internals.socket.destroy(); //Just incase
                    this._internals.socket = null;
                }
                debug(`disconnect(): Connection closed successfully`);
            }
            catch (err) {
                //Force socket close
                (_f = this._internals.socket) === null || _f === void 0 ? void 0 : _f.destroy();
                this.connection.connected = false;
                this.connection.localAdsPort = 0;
                this._internals.socket = null;
                const error = new ServerException(this, 'disconnect()', err);
                error.message = `Disconnected but something failed: ${error.message}`;
                this.emit('disconnect');
                debug(`disconnect(): Connection closing failed, connection forced to close`);
                return reject(error);
            }
            this.emit('disconnect');
            resolve();
        });
    }
    /**
     * Disconnects and reconnects again. At the moment does NOT reinitialize subscriptions, everything is lost
     *
     * @param {} [forceDisconnect] - If true, the connection is dropped immediately (default = false)
     *
     */
    reconnect(forceDisconnect = false) {
        return new Promise(async (resolve, reject) => {
            if (this._internals.socket != null) {
                try {
                    debug(`reconnect(): Trying to disconnect`);
                    await this.disconnect(forceDisconnect);
                }
                catch (err) {
                    debug(`reconnect(): Disconnecting failed: %o`, err);
                }
            }
            debug(`reconnect(): Trying to connect`);
            return this.connect()
                .then(res => {
                debug(`reconnect(): Connected!`);
                this.emit('reconnect');
                resolve(res);
            })
                .catch(err => {
                debug(`reconnect(): Connecting failed`);
                reject(err);
            });
        });
    }
    /**
     * Sends a given data as notification using given notificationHandle and target info.
     */
    sendDeviceNotification(notification, data) {
        return new Promise(async (resolve, reject) => {
            if (!this.connection.connected)
                return reject(new ServerException(this, 'sendDeviceNotification()', `Server is not connected. Use connect() to connect first.`));
            debug(`sendDeviceNotification(): Sending device notification to ${notification.targetAmsNetId}:${notification.targetAdsPort} with handle ${notification.notificationHandle}`);
            //Sample
            const sample = Buffer.alloc(8 + data.byteLength);
            let pos = 0;
            //0..3 Notification handle
            sample.writeUInt32LE(notification.notificationHandle, pos);
            pos += 4;
            //4..7 Data length
            sample.writeUInt32LE(data.byteLength, pos);
            pos += 4;
            //8..n Data
            data.copy(sample, pos);
            pos += data.byteLength;
            //Stamp
            const stamp = Buffer.alloc(12);
            pos = 0;
            //0..7 Timestamp (Converting to Windows FILETIME)
            const ts = long_1.default.fromNumber(new Date().getTime()).add(11644473600000).mul(10000);
            stamp.writeUInt32LE(ts.getLowBitsUnsigned(), pos);
            pos += 4;
            stamp.writeUInt32LE(ts.getHighBitsUnsigned(), pos);
            pos += 4;
            //8..11 Number of samples
            stamp.writeUInt32LE(1, pos);
            pos += 4;
            //Notification
            const packet = Buffer.alloc(8);
            pos = 0;
            //0..3 Data length
            packet.writeUInt32LE(sample.byteLength + stamp.byteLength + packet.byteLength);
            pos += 4;
            //4..7 Stamp count
            packet.writeUInt32LE(1, pos);
            pos += 4;
            //Check that next free invoke ID is below 32 bit integer maximum
            if (this._internals.nextInvokeId >= ADS.ADS_INVOKE_ID_MAX_VALUE)
                this._internals.nextInvokeId = 0;
            //Sending the packet
            _sendAdsCommand.call(this, {
                adsCommand: ADS.ADS_COMMAND.Notification,
                targetAmsNetId: notification.targetAmsNetId,
                targetAdsPort: notification.targetAdsPort,
                invokeId: this._internals.nextInvokeId++,
                rawData: Buffer.concat([packet, stamp, sample])
            })
                .then(() => {
                debug(`sendDeviceNotification(): Device notification sent to ${notification.targetAmsNetId}:${notification.targetAdsPort} with handle ${notification.notificationHandle}`);
                resolve();
            })
                .catch(res => {
                reject(new ServerException(this, 'sendDeviceNotification()', `Sending notification to ${notification.targetAmsNetId}:${notification.targetAdsPort} with handle ${notification.notificationHandle} failed`, res));
            });
        });
    }
    /**
     * Trims the given PLC string until end mark (\0, 0 byte) is found
     * (= removes empty bytes from end of the string)
     * @param {string} plcString String to trim
     *
     * @returns {string} Trimmed string
     */
    trimPlcString(plcString) {
        let parsedStr = '';
        for (let i = 0; i < plcString.length; i++) {
            if (plcString.charCodeAt(i) === 0)
                break;
            parsedStr += plcString[i];
        }
        return parsedStr;
    }
}
exports.Server = Server;
/**
 * Own exception class used for Server errors
 *
 * Derived from Error but added innerException and ADS error information
 *
 */
class ServerException extends Error {
    constructor(server, sender, messageOrError, ...errData) {
        //The 2nd parameter can be either message or another Error or ServerException
        super(messageOrError.message ? messageOrError.message : messageOrError);
        this.adsErrorInfo = null;
        this.metaData = null;
        this.errorTrace = [];
        if (messageOrError instanceof ServerException) {
            //Add to errData, so will be handled later
            errData.push(messageOrError);
        }
        else if (messageOrError instanceof Error) {
            //Add to errData, so will be handled later
            errData.push(messageOrError);
        }
        //Stack trace
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
        else {
            this.stack = (new Error(this.message)).stack;
        }
        this.name = this.constructor.name;
        this.sender = sender;
        this.adsError = false;
        this.adsErrorInfo = null;
        this.metaData = null;
        this.errorTrace = [];
        this.getInnerException = () => null;
        //Loop through given additional data
        errData.forEach(data => {
            var _a, _b, _c;
            if (data instanceof ServerException && this.getInnerException == null) {
                //Another ServerException error
                this.getInnerException = () => data;
                //Add it to our own tracing array
                this.errorTrace.push(`${this.getInnerException().sender}: ${(_a = this.getInnerException()) === null || _a === void 0 ? void 0 : _a.message}`);
                //Add also all traces from the inner exception
                this.getInnerException().errorTrace.forEach((s) => this.errorTrace.push(s));
                //Modifying the stack trace so it contains all previous ones too
                //Source: Matt @ https://stackoverflow.com/a/42755876/8140625
                if (server._internals && server._internals.debugLevel > 0) {
                    const message_lines = (this.message.match(/\n/g) || []).length + 1;
                    this.stack = this.stack ? this.stack.split('\n').slice(0, message_lines + 1).join('\n') + '\n' : "" + ((_b = this.getInnerException()) === null || _b === void 0 ? void 0 : _b.stack);
                }
            }
            else if (data instanceof Error && this.getInnerException == null) {
                //Error -> Add it's message to our message
                this.message += ` (${data.message})`;
                this.getInnerException = () => data;
                //Modifying the stack trace so it contains all previous ones too
                //Source: Matt @ https://stackoverflow.com/a/42755876/8140625
                if (server._internals && server._internals.debugLevel > 0) {
                    const message_lines = (this.message.match(/\n/g) || []).length + 1;
                    this.stack = this.stack ? this.stack.split('\n').slice(0, message_lines + 1).join('\n') + '\n' : "" + ((_c = this.getInnerException()) === null || _c === void 0 ? void 0 : _c.stack);
                }
            }
            else if (data.ams && data.ams.error) {
                //AMS reponse with error code
                this.adsError = true;
                this.adsErrorInfo = {
                    adsErrorType: 'AMS error',
                    adsErrorCode: data.ams.errorCode,
                    adsErrorStr: data.ams.errorStr
                };
            }
            else if (data.ads && data.ads.error) {
                //ADS response with error code
                this.adsError = true;
                this.adsErrorInfo = {
                    adsErrorType: 'ADS error',
                    adsErrorCode: data.ads.errorCode,
                    adsErrorStr: data.ads.errorStr
                };
            }
            else if (this.metaData == null) {
                //If something else is provided, save it
                this.metaData = data;
            }
        });
        //If this particular exception has no ADS error, check if the inner exception has
        //It should always be passed upwards to the end-user
        if (!this.adsError && this.getInnerException() != null) {
            const inner = this.getInnerException();
            if (inner.adsError != null && inner.adsError === true) {
                this.adsError = true;
                this.adsErrorInfo = inner.adsErrorInfo;
            }
        }
    }
}
/**
 * Libray internal methods are documented inside a virtual namespace *_LibraryInternals*.
 *
 * These methods **are not meant for end-user** and they are not available through module exports.
 *
 * @namespace _LibraryInternals
 */
function _setRequestCallback(request, callback) {
    //Allowing null so a callback can be removed
    if (typeof callback !== 'function' && callback != null) {
        throw new TypeError(`Given callback was not a function, it was ${typeof callback} instead`);
    }
    this._internals.requestCallbacks[ADS.ADS_COMMAND.toString(request)] = callback;
}
/**
 * Registers a new ADS port from used AMS router
 *
 * Principe is from .NET library TwinCAT.Ads.dll
 *
 * @returns {Promise<object>} Returns a promise (async function)
 * - If resolved, registering a port was successful and local AmsNetId and ADS port are returned (object)
 * - If rejected, registering failed and error info is returned (object)
 *
 * @memberof _LibraryInternals
 */
function _registerAdsPort() {
    return new Promise((resolve) => {
        debugD(`_registerAdsPort(): Registering an ADS port from ADS router ${this.settings.routerAddress}:${this.settings.routerTcpPort}`);
        //If a manual AmsNetId and ADS port values are used, we should resolve immediately
        //This is used for example if connecting to a remote PLC from non-ads device
        if (this.settings.localAmsNetId && this.settings.localAdsPort) {
            debug(`_registerAdsPort(): Local AmsNetId and ADS port manually given so using ${this.settings.localAmsNetId}:${this.settings.localAdsPort}`);
            const res = { amsTcp: {} };
            res.amsTcp.data = {
                localAmsNetId: this.settings.localAmsNetId,
                localAdsPort: this.settings.localAdsPort
            };
            return resolve(res);
        }
        const packet = Buffer.alloc(8);
        let pos = 0;
        //0..1 Ams command (header flag)
        packet.writeUInt16LE(ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_CONNECT);
        pos += 2;
        //2..5 Data length
        packet.writeUInt32LE(2, pos);
        pos += 4;
        //6..7 Data: Requested ads port (0 = let the server decide)
        packet.writeUInt16LE((this.settings.localAdsPort ? this.settings.localAdsPort : 0), pos);
        this._internals.amsTcpCallback = (res) => {
            this._internals.amsTcpCallback = null;
            debugD(`_registerAdsPort(): ADS port registered, assigned AMS address is ${res.amsTcp.data.localAmsNetId}:${res.amsTcp.data.localAdsPort}`);
            return resolve(res);
        };
        _socketWrite.call(this, packet);
    });
}
/**
 * Unregisters previously registered ADS port from AMS router
 *
 * Principe is from .NET library TwinCAT.Ads.dll
 *
 * @returns {Promise<object>} Returns a promise (async function)
 * - In all cases this is resolved, ADS port is unregistered
 *
 * @memberof _LibraryInternals
 */
function _unregisterAdsPort() {
    return new Promise(async (resolve) => {
        var _a;
        debugD(`_unregisterAdsPort(): Unregister ads port ${this.connection.localAdsPort} from ${this.settings.routerAddress}:${this.settings.routerTcpPort}`);
        if (this.settings.localAdsPort) {
            debug(`_unregisterAdsPort(): Local AmsNetId and ADS port manually given so no need to unregister`);
            (_a = this._internals.socket) === null || _a === void 0 ? void 0 : _a.end(() => {
                var _a;
                debugD(`_unregisterAdsPort(): Socket closed`);
                (_a = this._internals.socket) === null || _a === void 0 ? void 0 : _a.destroy();
                debugD(`_unregisterAdsPort(): Socket destroyed`);
            });
            return resolve();
        }
        if (this._internals.socket == null) {
            return resolve();
        }
        const buffer = Buffer.alloc(8);
        let pos = 0;
        //0..1 AMS command (header flag)
        buffer.writeUInt16LE(ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_CLOSE);
        pos += 2;
        //2..5 Data length
        buffer.writeUInt32LE(2, pos);
        pos += 4;
        //6..9 Data: port to unregister
        buffer.writeUInt16LE(this.connection.localAdsPort, pos);
        this._internals.socket.once('timeout', () => {
            debugD(`_unregisterAdsPort(): Timeout happened during port unregister. Closing connection anyways.`);
            if (this._internals.socket) {
                this._internals.socket.end(() => {
                    debugD(`_unregisterAdsPort(): Socket closed after timeout`);
                    if (this._internals.socket)
                        this._internals.socket.destroy();
                    debugD(`_unregisterAdsPort(): Socket destroyed after timeout`);
                });
            }
        });
        //When socket emits close event, the ads port is unregistered and connection closed
        this._internals.socket.once('close', (hadError) => {
            debugD(`_unregisterAdsPort(): Ads port unregistered and socket connection closed (hadError: ${hadError}).`);
            resolve();
        });
        //Sometimes close event is not received, so resolve already here
        this._internals.socket.once('end', () => {
            debugD(`_unregisterAdsPort(): Socket connection ended. Connection closed.`);
            if (this._internals.socket)
                this._internals.socket.destroy();
            resolve();
        });
        _socketWrite.call(this, buffer);
    });
}
/**
 * Called when connection to the remote is lost
 *
 * @param {boolean} socketFailure - If true, connection was lost due socket/tcp problem -> Just destroy the socket
 *
 * @memberof _LibraryInternals
 */
async function _onConnectionLost(socketFailure = false) {
    debug(`_onConnectionLost(): Connection was lost. Socket failure: ${socketFailure}`);
    this.emit('connectionLost');
    if (this.settings.autoReconnect !== true) {
        _console.call(this, 'WARNING: Connection was lost and setting autoReconnect=false. Quiting.');
        try {
            await this.disconnect(true);
        }
        catch (err) {
            debug(`_onConnectionLost(): Disconnecting failed`);
        }
        return;
    }
    _console.call(this, 'WARNING: Connection was lost. Trying to reconnect...');
    this.connection.connected = false;
    //Clear timers
    clearTimeout(this._internals.reconnectionTimer);
    const tryToReconnect = async (firstTime) => {
        this.reconnect(socketFailure)
            .then(() => {
            _console.call(this, 'Reconnected successfully');
            debug(`_onConnectionLost(): Connection reinitialized`);
        })
            .catch(err => {
            debug(`_onConnectionLost(): Failed to reconnect: ${err.message}`);
            if (firstTime)
                _console.call(this, `WARNING: Reconnecting failed. Keeping trying in the background every ${this.settings.reconnectInterval} ms...`);
            this._internals.reconnectionTimer = setTimeout(tryToReconnect, this.settings.reconnectInterval);
        });
    };
    tryToReconnect(true);
}
/**
 * Writes given data buffer to the socket
 *
 * Just a simple wrapper for socket.write()
 *
 * @param data Buffer to write
 *
 * @memberof _LibraryInternals
 */
function _socketWrite(data) {
    if (debugIO.enabled) {
        debugIO(`IO out ------> ${data.byteLength} bytes : ${data.toString('hex')}`);
    }
    else {
        debugD(`IO out ------> ${data.byteLength} bytes`);
    }
    if (this._internals.socket)
        this._internals.socket.write(data);
}
/**
 * Event listener for socket.on('data')
 *
 * Adds received data to the receive buffer
 *
 * @memberof _LibraryInternals
 */
function _socketReceive(data) {
    if (debugIO.enabled) {
        debugIO(`IO in  <------ ${data.byteLength} bytes: ${data.toString('hex')}`);
    }
    else {
        debugD(`IO in  <------ ${data.byteLength} bytes`);
    }
    //Add received data to buffer
    this._internals.receiveDataBuffer = Buffer.concat([this._internals.receiveDataBuffer, data]);
    //Check data for valid messages
    _checkReceivedData.call(this);
}
/**
 * Called when local AMS router status has changed (Router notification received)
 * For example router state changes when local TwinCAT changes from Config to Run state and vice-versa
 *
 * @param data Packet that contains the new router state
 *
 * @memberof _LibraryInternals
 */
async function _onRouterStateChanged(data) {
    const routerStateData = data.amsTcp.data;
    const state = routerStateData.routerState;
    debug(`_onRouterStateChanged(): Local AMS router state has changed${(this.metaData.routerState.stateStr ? ` from ${this.metaData.routerState.stateStr}` : '')} to ${ADS.AMS_ROUTER_STATE.toString(state)} (${state})`);
    this.metaData.routerState = {
        state: state,
        stateStr: ADS.AMS_ROUTER_STATE.toString(state)
    };
    this.emit('routerStateChange', this.metaData.routerState);
    debug(`_onRouterStateChanged(): Local loopback connection active, monitoring router state`);
    if (this.metaData.routerState.state === ADS.AMS_ROUTER_STATE.START) {
        _console.call(this, `WARNING: Local AMS router state has changed to ${ADS.AMS_ROUTER_STATE.toString(state)}. Reconnecting...`);
        _onConnectionLost.call(this);
    }
    else {
        //Nothing to do, just wait until router has started again..
        _console.call(this, `WARNING: Local AMS router state has changed to ${ADS.AMS_ROUTER_STATE.toString(state)}. Connection might have been lost.`);
    }
}
/**
 * Checks received data buffer for full AMS packets. If full packet is found, it is parsed and handled.
 *
 * Calls itself recursively if multiple packets available. Added also setImmediate calls to prevent event loop from blocking
 *
 * @memberof _LibraryInternals
 */
function _checkReceivedData() {
    //If we haven't enough data to determine packet size, quit
    if (this._internals.receiveDataBuffer.byteLength < ADS.AMS_TCP_HEADER_LENGTH)
        return;
    //There should be an AMS packet, so the packet size is available in the bytes 2..5
    const packetLength = this._internals.receiveDataBuffer.readUInt32LE(2) + ADS.AMS_TCP_HEADER_LENGTH;
    //Not enough data yet? quit
    if (this._internals.receiveDataBuffer.byteLength < packetLength)
        return;
    //Note: Changed from slice to Buffer.from - Should this be reconsidered?
    //const data = this._internals.receiveDataBuffer.slice(0, packetLength)
    const data = Buffer.from(this._internals.receiveDataBuffer.slice(0, packetLength));
    this._internals.receiveDataBuffer = this._internals.receiveDataBuffer.slice(data.byteLength);
    //Parse the packet, but allow time for the event loop
    setImmediate(_parseAmsTcpPacket.bind(this, data));
    //If there is more, call recursively but allow time for the event loop
    if (this._internals.receiveDataBuffer.byteLength >= ADS.AMS_TCP_HEADER_LENGTH) {
        setImmediate(_checkReceivedData.bind(this));
    }
}
/**
 * Parses an AMS/TCP packet from given (byte) Buffer and then handles it
 *
 * @param {Buffer} data Buffer that contains data for a single full AMS/TCP packet
 *
 * @memberof _LibraryInternals
 */
async function _parseAmsTcpPacket(data) {
    const packet = {};
    //1. Parse AMS/TCP header
    const parsedAmsTcpHeader = _parseAmsTcpHeader.call(this, data);
    packet.amsTcp = parsedAmsTcpHeader.amsTcp;
    data = parsedAmsTcpHeader.data;
    //2. Parse AMS header (if exists)
    const parsedAmsHeader = _parseAmsHeader.call(this, data);
    packet.ams = parsedAmsHeader.ams;
    data = parsedAmsHeader.data;
    //3. Parse ADS data (if exists)
    packet.ads = (packet.ams.error ? { rawData: Buffer.alloc(0) } : _parseAdsData.call(this, packet, data));
    //4. Handle the parsed packet
    _onAmsTcpPacketReceived.call(this, packet);
}
/**
 * Parses an AMS/TCP header from given (byte) Buffer
 *
 * @param {Buffer} data Buffer that contains data for a single full AMS/TCP packet
 *
 * @returns {object} Object {amsTcp, data}, where amsTcp is the parsed header and data is rest of the data
 *
 * @memberof _LibraryInternals
 */
function _parseAmsTcpHeader(data) {
    debugD(`_parseAmsTcpHeader(): Starting to parse AMS/TCP header`);
    let pos = 0;
    const amsTcp = {};
    //0..1 AMS command (header flag)
    amsTcp.command = data.readUInt16LE(pos);
    amsTcp.commandStr = ADS.AMS_HEADER_FLAG.toString(amsTcp.command);
    pos += 2;
    //2..5 Data length
    amsTcp.dataLength = data.readUInt32LE(pos);
    pos += 4;
    //Remove AMS/TCP header from data  
    data = data.slice(ADS.AMS_TCP_HEADER_LENGTH);
    //If data length is less than AMS_HEADER_LENGTH,
    //we know that this packet has no AMS headers -> it's only a AMS/TCP command
    if (data.byteLength < ADS.AMS_HEADER_LENGTH) {
        amsTcp.data = data;
        //Remove data (basically creates an empty buffer..)
        data = data.slice(data.byteLength);
    }
    debugD(`_parseAmsTcpHeader(): AMS/TCP header parsed: %o`, amsTcp);
    return { amsTcp, data };
}
/**
 * Parses an AMS header from given (byte) Buffer
 *
 * @param {Buffer} data Buffer that contains data for a single AMS packet (without AMS/TCP header)
 *
 * @returns {object} Object {ams, data}, where ams is the parsed AMS header and data is rest of the data
 *
 * @memberof _LibraryInternals
 */
function _parseAmsHeader(data) {
    debugD(`_parseAmsHeader(): Starting to parse AMS header`);
    let pos = 0;
    const ams = {};
    if (data.byteLength < ADS.AMS_HEADER_LENGTH) {
        debugD(`_parseAmsHeader(): No AMS header found`);
        return { ams, data };
    }
    //0..5 Target AMSNetId
    ams.targetAmsNetId = _byteArrayToAmsNedIdStr(data.slice(pos, pos + ADS.AMS_NET_ID_LENGTH));
    pos += ADS.AMS_NET_ID_LENGTH;
    //6..8 Target ads port
    ams.targetAdsPort = data.readUInt16LE(pos);
    pos += 2;
    //8..13 Source AMSNetId
    ams.sourceAmsNetId = _byteArrayToAmsNedIdStr(data.slice(pos, pos + ADS.AMS_NET_ID_LENGTH));
    pos += ADS.AMS_NET_ID_LENGTH;
    //14..15 Source ads port
    ams.sourceAdsPort = data.readUInt16LE(pos);
    pos += 2;
    //16..17 ADS command
    ams.adsCommand = data.readUInt16LE(pos);
    ams.adsCommandStr = ADS.ADS_COMMAND.toString(ams.adsCommand);
    pos += 2;
    //18..19 State flags
    ams.stateFlags = data.readUInt16LE(pos);
    ams.stateFlagsStr = ADS.ADS_STATE_FLAGS.toString(ams.stateFlags);
    pos += 2;
    //20..23 Data length
    ams.dataLength = data.readUInt32LE(pos);
    pos += 4;
    //24..27 Error code
    ams.errorCode = data.readUInt32LE(pos);
    pos += 4;
    //28..31 Invoke ID
    ams.invokeId = data.readUInt32LE(pos);
    pos += 4;
    //Remove AMS header from data  
    data = data.slice(ADS.AMS_HEADER_LENGTH);
    //ADS error
    ams.error = (ams.errorCode !== null ? ams.errorCode > 0 : false);
    ams.errorStr = '';
    if (ams.error) {
        ams.errorStr = ADS.ADS_ERROR[ams.errorCode];
    }
    debugD(`_parseAmsHeader(): AMS header parsed: %o`, ams);
    return { ams, data };
}
/**
 * Parses ADS data from given (byte) Buffer. Uses packet.ams to determine the ADS command
 *
 * @param {Buffer} data Buffer that contains data for a single ADS packet (without AMS/TCP header and AMS header)
 *
 * @returns {object} Object that contains the parsed ADS data
 *
 * @memberof _LibraryInternals
 */
function _parseAdsData(packet, data) {
    debugD(`_parseAdsData(): Starting to parse ADS data`);
    let pos = 0;
    /*
    const ads: AdsData = {
      rawData: data
    }*/
    if (data.byteLength === 0) {
        debugD(`_parseAdsData(): No ADS data found`);
        return {
        //TODO
        };
    }
    let ads;
    switch (packet.ams.adsCommand) {
        //-------------- Read Write ---------------
        case ADS.ADS_COMMAND.ReadWrite:
            ads = {};
            //0..3
            ads.indexGroup = data.readUInt32LE(pos);
            pos += 4;
            //4..7
            ads.indexOffset = data.readUInt32LE(pos);
            pos += 4;
            //8..11
            ads.readLength = data.readUInt32LE(pos);
            pos += 4;
            //8..9 
            ads.writeLength = data.readUInt32LE(pos);
            pos += 4;
            //..n Data
            ads.data = Buffer.alloc(ads.writeLength);
            data.copy(ads.data, 0, pos);
            return ads;
            break;
        case ADS.ADS_COMMAND.Read:
            ads = {};
            //0..3
            ads.indexGroup = data.readUInt32LE(pos);
            pos += 4;
            //4..7
            ads.indexOffset = data.readUInt32LE(pos);
            pos += 4;
            //8..11
            ads.readLength = data.readUInt32LE(pos);
            pos += 4;
            break;
        //-------------- Write ---------------
        case ADS.ADS_COMMAND.Write:
            ads = {};
            //0..3
            ads.indexGroup = data.readUInt32LE(pos);
            pos += 4;
            //4..7
            ads.indexOffset = data.readUInt32LE(pos);
            pos += 4;
            //8..9 
            ads.writeLength = data.readUInt32LE(pos);
            pos += 4;
            //..n Data
            ads.data = Buffer.alloc(ads.writeLength);
            data.copy(ads.data, 0, pos);
            break;
        //-------------- Device info ---------------
        case ADS.ADS_COMMAND.ReadDeviceInfo:
            //No request payload
            ads = {};
            break;
        //-------------- Device status ---------------
        case ADS.ADS_COMMAND.ReadState:
            //No request payload
            ads = {};
            break;
        //-------------- Add notification ---------------
        case ADS.ADS_COMMAND.AddNotification:
            ads = {};
            //0..3 IndexGroup
            ads.indexGroup = data.readUInt32LE(pos);
            pos += 4;
            //4..7 IndexOffset
            ads.indexOffset = data.readUInt32LE(pos);
            pos += 4;
            //8..11 Data length
            ads.dataLength = data.readUInt32LE(pos);
            pos += 4;
            //12..15 Transmission mode
            ads.transmissionMode = data.readUInt32LE(pos);
            ads.transmissionModeStr = ADS.ADS_TRANS_MODE.toString(ads.transmissionMode);
            pos += 4;
            //16..19 Maximum delay (ms) - When subscribing, a notification is sent after this time even if no changes 
            ads.maximumDelay = data.readUInt32LE(pos) / 10000;
            pos += 4;
            //20..23 Cycle time (ms) - How often the PLC checks for value changes (minimum value: Task 0 cycle time)
            ads.cycleTime = data.readUInt32LE(pos) / 10000;
            pos += 4;
            //24..40 reserved
            ads.reserved = data.slice(pos);
            break;
        //-------------- Delete notification ---------------
        case ADS.ADS_COMMAND.DeleteNotification:
            ads = {};
            //0..3 Notification handle
            ads.notificationHandle = data.readUInt32LE(pos);
            pos += 4;
            break;
        //-------------- Notification ---------------
        case ADS.ADS_COMMAND.Notification:
            //Server shouldn't receive this
            break;
        //-------------- WriteControl ---------------
        case ADS.ADS_COMMAND.WriteControl: {
            ads = {};
            //0..1 ADS state
            ads.adsState = data.readUInt16LE(pos);
            ads.adsStateStr = ADS.ADS_STATE.toString(ads.adsState);
            pos += 2;
            //2..3 Device state
            ads.deviceState = data.readUInt16LE(pos);
            pos += 2;
            //4..7 Data length
            const dataLen = data.readUInt32LE(pos);
            pos += 4;
            //7..n Data
            ads.data = Buffer.alloc(dataLen);
            data.copy(ads.data, 0, pos);
            break;
        }
    }
    debugD(`_parseAdsData(): ADS data parsed: %o`, ads);
    if (ads) {
        return ads;
    }
    else {
        debug(`_parseAdsResponse: Unknown ads command received: ${packet.ams.adsCommand}`);
        return {
            error: true,
            errorStr: `Unknown ADS command for parser: ${packet.ams.adsCommand} (${packet.ams.adsCommandStr})`,
            errorCode: -1
        };
    }
}
/**
 * Handles the parsed AMS/TCP packet and actions/callbacks etc. related to it.
 *
 * @param {object} packet Fully parsed AMS/TCP packet, includes AMS/TCP header and if available, also AMS header and ADS data
 *  *
 * @memberof _LibraryInternals
 */
async function _onAmsTcpPacketReceived(packet) {
    debugD(`_onAmsTcpPacketReceived(): A parsed AMS packet received with command ${packet.amsTcp.command}`);
    switch (packet.amsTcp.command) {
        //-------------- ADS command ---------------
        case ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_AMS_CMD:
            packet.amsTcp.commandStr = 'Ads command';
            _onAdsCommandReceived.call(this, packet);
            break;
        //-------------- AMS/TCP port unregister ---------------
        case ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_CLOSE:
            packet.amsTcp.commandStr = 'Port unregister';
            //TODO: No action at the moment
            break;
        //-------------- AMS/TCP port register ---------------
        case ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_CONNECT:
            packet.amsTcp.commandStr = 'Port register';
            //Parse data
            if (packet.amsTcp.data instanceof Buffer) {
                const data = packet.amsTcp.data;
                packet.amsTcp.data = {
                    //0..5 Own AmsNetId
                    localAmsNetId: _byteArrayToAmsNedIdStr(data.slice(0, ADS.AMS_NET_ID_LENGTH)),
                    //5..6 Own assigned ADS port
                    localAdsPort: data.readUInt16LE(ADS.AMS_NET_ID_LENGTH)
                };
                if (this._internals.amsTcpCallback !== null) {
                    this._internals.amsTcpCallback(packet);
                }
                else {
                    debugD(`_onAmsTcpPacketReceived(): Port register response received but no callback was assigned (${packet.amsTcp.commandStr})`);
                }
            }
            else {
                debugD(`_onAmsTcpPacketReceived(): amsTcp data is unknown type`);
            }
            break;
        //-------------- AMS router note ---------------
        case ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_ROUTER_NOTE:
            packet.amsTcp.commandStr = 'Port router note';
            //Parse data
            if (packet.amsTcp.data instanceof Buffer) {
                const data = packet.amsTcp.data;
                packet.amsTcp.data = {
                    //0..3 Router state
                    routerState: data.readUInt32LE(0)
                };
                _onRouterStateChanged.call(this, packet);
            }
            else {
                debugD(`_onAmsTcpPacketReceived(): amsTcp data is unknown type`);
            }
            break;
        //-------------- Get local ams net id response ---------------
        case ADS.AMS_HEADER_FLAG.GET_LOCAL_NETID:
            packet.amsTcp.commandStr = 'Get local net id';
            //TODO: No action at the moment
            break;
        default:
            packet.amsTcp.commandStr = `Unknown AMS/TCP command ${packet.amsTcp.command}`;
            debug(`_onAmsTcpPacketReceived(): Unknown AMS/TCP command received: "${packet.amsTcp.command}" - Doing nothing`);
            //TODO: No action at the moment
            break;
    }
}
/**
 * Handles incoming ADS commands
 *
 * @param {object} packet Fully parsed AMS/TCP packet, includes AMS/TCP header, AMS header and ADS data
 *  *
 * @memberof _LibraryInternals
 */
async function _onAdsCommandReceived(packet) {
    debugD(`_onAdsCommandReceived(): A parsed ADS command received with command ${packet.ams.adsCommand}`);
    //Get callback by ads command
    const callback = this._internals.requestCallbacks[packet.ams.adsCommandStr];
    if (callback == null) {
        //Command received but no callback
        _console.call(this, `NOTE: ${packet.ams.adsCommandStr} request received from ${packet.ams.sourceAmsNetId}:${packet.ams.sourceAdsPort} but no callback assigned`);
        return;
    }
    switch (packet.ams.adsCommand) {
        //ReadWrite and Read requests
        case ADS.ADS_COMMAND.ReadWrite:
        case ADS.ADS_COMMAND.Read:
            callback(packet.ads, async (response = {}) => {
                let buffer = null, pos = 0;
                if (response.data != null && Buffer.isBuffer(response.data)) {
                    buffer = Buffer.alloc(8 + response.data.byteLength);
                    //0..3 ADS error
                    buffer.writeUInt32LE(response.error != null ? response.error : 0, pos);
                    pos += 4;
                    //4..7 Data length
                    buffer.writeUInt32LE(response.data.byteLength, pos);
                    pos += 4;
                    //8..n Data
                    response.data.copy(buffer, pos);
                }
                else {
                    buffer = Buffer.alloc(8);
                    //0..3 ADS error
                    buffer.writeUInt32LE(response.error != null ? response.error : 0, pos);
                    pos += 4;
                    //4..7 Data length
                    buffer.writeUInt32LE(0, pos);
                    pos += 4;
                }
                //Sending the response
                await _sendAdsCommand.call(this, {
                    adsCommand: packet.ams.adsCommand,
                    targetAmsNetId: packet.ams.sourceAmsNetId,
                    targetAdsPort: packet.ams.sourceAdsPort,
                    invokeId: packet.ams.invokeId,
                    rawData: buffer
                });
            }, packet);
            break;
        //Write request
        case ADS.ADS_COMMAND.Write:
            callback(packet.ads, async (response = {}) => {
                const buffer = Buffer.alloc(4);
                //0..3 ADS error
                buffer.writeUInt32LE(response !== undefined && response.error != null ? response.error : 0, 0);
                //Sending the response
                await _sendAdsCommand.call(this, {
                    adsCommand: packet.ams.adsCommand,
                    targetAmsNetId: packet.ams.sourceAmsNetId,
                    targetAdsPort: packet.ams.sourceAdsPort,
                    invokeId: packet.ams.invokeId,
                    rawData: buffer
                });
            }, packet);
            break;
        //Device info request
        case ADS.ADS_COMMAND.ReadDeviceInfo:
            callback(packet.ads, async (response = {}) => {
                const buffer = Buffer.alloc(24);
                let pos = 0;
                //0..3 ADS error
                buffer.writeUInt32LE(response.error != null ? response.error : 0, pos);
                pos += 4;
                //4 Major version
                buffer.writeUInt8(response.majorVersion != null ? response.majorVersion : 0, pos);
                pos += 1;
                //5 Minor version
                buffer.writeUInt8(response.minorVersion != null ? response.minorVersion : 0, pos);
                pos += 1;
                //6..7 Version build
                buffer.writeUInt16LE(response.versionBuild != null ? response.versionBuild : 0, pos);
                pos += 2;
                //8..24 Device name
                iconv_lite_1.default.encode(response.deviceName != null ? response.deviceName : '', 'cp1252').copy(buffer, pos);
                //Sending the response
                await _sendAdsCommand.call(this, {
                    adsCommand: packet.ams.adsCommand,
                    targetAmsNetId: packet.ams.sourceAmsNetId,
                    targetAdsPort: packet.ams.sourceAdsPort,
                    invokeId: packet.ams.invokeId,
                    rawData: buffer
                });
            }, packet);
            break;
        //Read state request
        case ADS.ADS_COMMAND.ReadState:
            callback(packet.ads, async (response = {}) => {
                const buffer = Buffer.alloc(8);
                let pos = 0;
                //0..3 ADS error
                buffer.writeUInt32LE(response.error != null ? response.error : 0, pos);
                pos += 4;
                //4..5 ADS state (ADS.ADS_STATE.Invalid = 0)
                buffer.writeUInt16LE(response.adsState != null ? response.adsState : ADS.ADS_STATE.Invalid, pos);
                pos += 2;
                //6..7 Device state
                buffer.writeUInt16LE(response.deviceState != null ? response.deviceState : 0, pos);
                pos += 2;
                //Sending the response
                await _sendAdsCommand.call(this, {
                    adsCommand: packet.ams.adsCommand,
                    targetAmsNetId: packet.ams.sourceAmsNetId,
                    targetAdsPort: packet.ams.sourceAdsPort,
                    invokeId: packet.ams.invokeId,
                    rawData: buffer
                });
            }, packet);
            break;
        //Add notification request
        case ADS.ADS_COMMAND.AddNotification:
            //Let's add a helper object for sending notifications
            packet.ads.notificationTarget = {
                targetAmsNetId: packet.ams.targetAmsNetId,
                targetAdsPort: packet.ams.sourceAdsPort
            };
            callback(packet.ads, async (response = {}) => {
                const buffer = Buffer.alloc(8);
                let pos = 0;
                //0..3 ADS error
                buffer.writeUInt32LE(response.error != null ? response.error : 0, pos);
                pos += 4;
                //4..7 Notification handle
                buffer.writeUInt32LE(response.notificationHandle != null ? response.notificationHandle : 0, pos);
                pos += 2;
                //Sending the response
                await _sendAdsCommand.call(this, {
                    adsCommand: packet.ams.adsCommand,
                    targetAmsNetId: packet.ams.sourceAmsNetId,
                    targetAdsPort: packet.ams.sourceAdsPort,
                    invokeId: packet.ams.invokeId,
                    rawData: buffer
                });
            }, packet);
            break;
        //Delete notification request
        case ADS.ADS_COMMAND.DeleteNotification:
            callback(packet.ads, async (response = {}) => {
                const buffer = Buffer.alloc(4);
                let pos = 0;
                //0..3 ADS error
                buffer.writeUInt32LE(response.error != null ? response.error : 0, pos);
                pos += 4;
                //Sending the response
                await _sendAdsCommand.call(this, {
                    adsCommand: packet.ams.adsCommand,
                    targetAmsNetId: packet.ams.sourceAmsNetId,
                    targetAdsPort: packet.ams.sourceAdsPort,
                    invokeId: packet.ams.invokeId,
                    rawData: buffer
                });
            }, packet);
            break;
        //-------------- Notification ---------------
        case ADS.ADS_COMMAND.Notification:
            /* TODO
            ads.data = _parseAdsNotification.call(this, data)
            */
            break;
        //-------------- WriteControl ---------------
        case ADS.ADS_COMMAND.WriteControl:
            callback(packet.ads, async (response) => {
                const buffer = Buffer.alloc(4);
                //0..3 ADS error
                buffer.writeUInt32LE(response.error ? response.error : 0, 0);
                //Sending the response
                await _sendAdsCommand.call(this, {
                    adsCommand: packet.ams.adsCommand,
                    targetAmsNetId: packet.ams.sourceAmsNetId,
                    targetAdsPort: packet.ams.sourceAdsPort,
                    invokeId: packet.ams.invokeId,
                    rawData: buffer
                });
            }, packet);
            break;
        default:
            //Unknown command
            debug(`_onAdsCommandReceived: Unknown ads command: ${packet.ams.adsCommand}`);
            _console.call(this, `WARNING: Unknown ADS command ${packet.ams.adsCommand} received from ${packet.ams.sourceAmsNetId}:${packet.ams.sourceAdsPort}`);
            break;
    }
}
/**
 * Sends an ADS command with given data to the PLC
 *
 * @param {number} adsCommand - ADS command to send (see ADS.ADS_COMMAND)
 * @param {Buffer} adsData - Buffer object that contains the data to send
 * @param {number} [targetAdsPort] - Target ADS port - default is this.settings.targetAdsPort
 *
 * @returns {Promise<object>} Returns a promise (async function)
 * - If resolved, command was sent successfully and response was received. The received reponse is parsed and returned (object)
 * - If rejected, sending, receiving or parsing failed and error info is returned (object)
 *
 * @memberof _LibraryInternals
 */
function _sendAdsCommand(data) {
    return new Promise(async (resolve, reject) => {
        //Creating the data packet object
        const packet = {
            amsTcp: {
                command: ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_AMS_CMD,
                commandStr: ADS.AMS_HEADER_FLAG.toString(ADS.AMS_HEADER_FLAG.AMS_TCP_PORT_AMS_CMD),
                dataLength: 0,
                data: null
            },
            ams: {
                targetAmsNetId: data.targetAmsNetId,
                targetAdsPort: data.targetAdsPort,
                sourceAmsNetId: this.connection.localAmsNetId,
                sourceAdsPort: this.connection.localAdsPort,
                adsCommand: data.adsCommand,
                adsCommandStr: ADS.ADS_COMMAND.toString(data.adsCommand),
                stateFlags: ADS.ADS_STATE_FLAGS.Response | ADS.ADS_STATE_FLAGS.AdsCommand,
                stateFlagsStr: '',
                dataLength: data.rawData.byteLength,
                errorCode: 0,
                invokeId: data.invokeId,
                error: false,
                errorStr: ''
            },
            ads: {
                rawData: data.rawData
            }
        };
        packet.ams.stateFlagsStr = ADS.ADS_STATE_FLAGS.toString(packet.ams.stateFlags);
        debugD(`_sendAdsCommand(): Sending an ads command ${packet.ams.adsCommandStr} (${data.rawData.byteLength} bytes): %o`, packet);
        //Creating a full AMS/TCP request
        let request = {};
        try {
            request = _createAmsTcpRequest.call(this, packet);
        }
        catch (err) {
            return reject(new ServerException(this, '_sendAdsCommand()', err));
        }
        //Write the data 
        try {
            _socketWrite.call(this, request);
            return resolve();
        }
        catch (err) {
            return reject(new ServerException(this, '_sendAdsCommand()', `Error - Socket is not available`, err));
        }
    });
}
/**
 * Creates an AMS/TCP request from given packet
 *
 * @param {object} packet Object containing the full AMS/TCP packet
 *
 * @returns {Buffer} Full created AMS/TCP request as a (byte) Buffer
 *
 * @memberof _LibraryInternals
 */
function _createAmsTcpRequest(packet) {
    //1. Create ADS data
    const adsData = packet.ads.rawData;
    //2. Create AMS header
    const amsHeader = _createAmsHeader.call(this, packet);
    //3. Create AMS/TCP header
    const amsTcpHeader = _createAmsTcpHeader.call(this, packet, amsHeader);
    //4. Create full AMS/TCP packet
    const amsTcpRequest = Buffer.concat([amsTcpHeader, amsHeader, adsData ? adsData : Buffer.alloc(0)]);
    debugD(`_createAmsTcpRequest(): AMS/TCP request created (${amsTcpRequest.byteLength} bytes)`);
    return amsTcpRequest;
}
/**
 * Creates an AMS header from given packet
 *
 * @param {object} packet Object containing the full AMS/TCP packet
 *
 * @returns {Buffer} Created AMS header as a (byte) Buffer
 *
 * @memberof _LibraryInternals
 */
function _createAmsHeader(packet) {
    //Allocating bytes for AMS header
    const header = Buffer.alloc(ADS.AMS_HEADER_LENGTH);
    let pos = 0;
    //0..5 Target AMSNetId
    Buffer.from(_amsNedIdStrToByteArray(packet.ams.targetAmsNetId)).copy(header, 0);
    pos += ADS.AMS_NET_ID_LENGTH;
    //6..8 Target ads port
    header.writeUInt16LE(packet.ams.targetAdsPort, pos);
    pos += 2;
    //8..13 Source ads port
    Buffer.from(_amsNedIdStrToByteArray(packet.ams.sourceAmsNetId)).copy(header, pos);
    pos += ADS.AMS_NET_ID_LENGTH;
    //14..15 Source ads port
    header.writeUInt16LE(packet.ams.sourceAdsPort, pos);
    pos += 2;
    //16..17 ADS command
    header.writeUInt16LE(packet.ams.adsCommand, pos);
    pos += 2;
    //18..19 State flags
    header.writeUInt16LE(packet.ams.stateFlags, pos);
    pos += 2;
    //20..23 Data length
    header.writeUInt32LE(packet.ams.dataLength, pos);
    pos += 4;
    //24..27 Error code
    header.writeUInt32LE(packet.ams.errorCode, pos);
    pos += 4;
    //28..31 Invoke ID
    header.writeUInt32LE(packet.ams.invokeId, pos);
    pos += 4;
    debugD(`_createAmsHeader(): AMS header created (${header.byteLength} bytes)`);
    if (debugIO.enabled) {
        debugIO(`_createAmsHeader(): AMS header created: %o`, header.toString('hex'));
    }
    return header;
}
/**
 * Creates an AMS/TCP header from given packet and AMS header
 *
 * @param {object} packet Object containing the full AMS/TCP packet
 * @param {Buffer} amsHeader Buffer containing the previously created AMS header
 *
 * @returns {Buffer} Created AMS/TCP header as a (byte) Buffer
 *
 * @memberof _LibraryInternals
 */
function _createAmsTcpHeader(packet, amsHeader) {
    //Allocating bytes for AMS/TCP header
    const header = Buffer.alloc(ADS.AMS_TCP_HEADER_LENGTH);
    let pos = 0;
    //0..1 AMS command (header flag)
    header.writeUInt16LE(packet.amsTcp.command, pos);
    pos += 2;
    //2..5 Data length
    header.writeUInt32LE(amsHeader.byteLength + packet.ams.dataLength, pos);
    pos += 4;
    debugD(`_createAmsTcpHeader(): AMS/TCP header created (${header.byteLength} bytes)`);
    if (debugIO.enabled) {
        debugIO(`_createAmsTcpHeader(): AMS/TCP header created: %o`, header.toString('hex'));
    }
    return header;
}
/**
 * Writes given message to console if settings.hideConsoleWarnings is false
 *
 * @param {string} str Message to console.log()
 *
 * @memberof _LibraryInternals
 */
function _console(str) {
    if (this.settings.hideConsoleWarnings !== true)
        console.log(`${PACKAGE_NAME}: ${str}`);
}
/**
 * **Helper:** Converts byte array (Buffer) to AmsNetId string
 *
 * @param {Buffer|array} byteArray Buffer/array that contains AmsNetId bytes
 *
 * @returns {string} AmsNetId as string
 *
 * @memberof _LibraryInternals
 */
function _byteArrayToAmsNedIdStr(byteArray) {
    return byteArray.join('.');
}
/**
 * **Helper:** Converts AmsNetId string to byte array
 *
 * @param {string} byteArray String that represents an AmsNetId
 *
 * @returns {array} AmsNetId as array
 *
 * @memberof _LibraryInternals
 */
function _amsNedIdStrToByteArray(str) {
    return str.split('.').map(x => parseInt(x));
}
//export * as ServerTypes from './types/ads-server'
//export * as AdsTypes from './types/ads-types'
exports.ADS = __importStar(require("./ads-commons"));
