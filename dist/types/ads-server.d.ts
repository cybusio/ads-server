/// <reference types="node" />
import type { Socket } from 'net';
import type { AmsTcpPacket } from './ads-types';
export interface ServerSettings {
    /** Optional: Target ADS router TCP port (default: 48898) */
    routerTcpPort: number;
    /** Optional: Target ADS router IP address/hostname (default: 'localhost') */
    routerAddress: string;
    /** Optional: Local IP address to use, use this to change used network interface if required (default: '' = automatic) */
    localAddress: string;
    /** Optional: Local TCP port to use for outgoing connections (default: 0 = automatic) */
    localTcpPort: number;
    /** Optional: Local AmsNetId to use (default: automatic) */
    localAmsNetId: string;
    /** Optional: Local ADS port to use (default: automatic/router provides) */
    localAdsPort: number;
    /** Optional: Time (milliseconds) after connecting to the router or waiting for command response is canceled to timeout (default: 2000) */
    timeoutDelay: number;
    /** Optional: If true, no warnings are written to console (= nothing is ever written to console) (default: false) */
    hideConsoleWarnings: boolean;
    /** Optional: If true and connection to the router is lost, the server tries to reconnect automatically (default: true) */
    autoReconnect: boolean;
    /** Optional: Time (milliseconds) how often the lost connection is tried to re-establish (default: 2000) */
    reconnectInterval: number;
}
export interface ServerInternals {
    /** Active debug level */
    debugLevel: number;
    /** Buffer for received data that is not yet handled */
    receiveDataBuffer: Buffer;
    /** Active socket that is used */
    socket: Socket | null;
    /** Next free invoke ID */
    nextInvokeId: number;
    /** Callback that is called when AMS TCP command is received (port register etc.) */
    amsTcpCallback: ((packet: AmsTcpPacket) => void) | null;
    /** Callback handler for socket connection lost event */
    socketConnectionLostHandler: (() => void) | null;
    /** Callback handler for socket error event */
    socketErrorHandler: ((err: any) => void) | null;
    /** Timer handle for reconnecting intervally */
    reconnectionTimer: any;
    /** Active callbacks for ADS requests */
    requestCallbacks: {
        [key: string]: GenericReqCallback;
    };
}
/**
 * Generic request callback
 * Just tells that we have req, res and packet properties
 */
export declare type GenericReqCallback = (req: any, res: any, packet?: AmsTcpPacket) => void;
/**
 * Server meta data
 */
export interface ServerMetaData {
    /** Current known state of the AMS router */
    routerState: RouterState;
}
export interface RouterState {
    /** Router state */
    state: number;
    /** Router state as string */
    stateStr: string;
}
/**
 * Connection info
 */
export interface ServerConnection {
    /** Is the server connected to the target AMS router */
    connected: boolean;
    /** Local AmsNetId (provided by router) */
    localAmsNetId: string;
    /** Local ADS port (provided by router) */
    localAdsPort: number;
}
/**
 * ADS notification target parameters
 */
export interface AdsNotificationTarget {
    /** Notification handle (unique for each registered notification) */
    notificationHandle: number;
    /** Target system AmsNetId (that subscribed to notifications) */
    targetAmsNetId: string;
    /** Target system ADS port (that subscribed to notifications) */
    targetAdsPort: number;
    [key: string]: any;
}
/**
 * Read request callback
 */
export declare type ReadReqCallback = (
/** Request data */
req: ReadReq, 
/** Response callback function (async) */
res: ReadReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/**
 * ReadWrite request callback
 */
export declare type ReadWriteReqCallback = (
/** Request data */
req: ReadWriteReq, 
/** Response callback function (async) */
res: ReadWriteReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/**
 * Write request callback
 */
export declare type WriteReqCallback = (
/** Request data */
req: WriteReq, 
/** Response callback function (async) */
res: WriteReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/**
 * ReadDevice request callback
 */
export declare type ReadDeviceInfoReqCallback = (
/** Request data (empty object) */
req: Record<string, never>, 
/** Response callback function (async) */
res: ReadDeviceInfoReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/**
 * ReadState request callback
 */
export declare type ReadStateReqCallback = (
/** Request data (empty object) */
req: Record<string, never>, 
/** Response callback function (async) */
res: ReadStateReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/**
 * AddNotification request callback
 */
export declare type AddNotificationReqCallback = (
/** Request data */
req: AddNotificationReq, 
/** Response callback function (async) */
res: AddNotificationReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/**
 * DeleteNotification request callback
 */
export declare type DeleteNotificationReqCallback = (
/** Request data */
req: DeleteNotificationReq, 
/** Response callback function (async) */
res: DeleteNotificationReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/**
 * WriteControl request callback
 */
export declare type WriteControlReqCallback = (
/** Request data */
req: WriteControlReq, 
/** Response callback function (async) */
res: WriteControlReqResponseCallback, 
/** AmsTcp full packet */
packet?: AmsTcpPacket) => void;
/** ADS request type (any of these) */
export declare type AdsRequest = EmptyReq | UnknownAdsRequest | ReadReq | ReadWriteReq | WriteReq | AddNotificationReq | DeleteNotificationReq | WriteControlReq;
/**
 * Unknown ads request
 */
export interface UnknownAdsRequest {
    error: boolean;
    errorStr: string;
    errorCode: number;
}
/**
 * Empty ads request (no payload)
 */
export declare type EmptyReq = {
    [K in any]: never;
};
/**
 * Read request data
 */
export interface ReadReq {
    /** Index group the read command is targeted to*/
    indexGroup: number;
    /** Index offset the read command is targeted to*/
    indexOffset: number;
    /** Requested read data length (bytes)*/
    readLength: number;
}
/**
 * ReadWrite request data
 */
export interface ReadWriteReq {
    /** Index group the read command is targeted to*/
    indexGroup: number;
    /** Index offset the read command is targeted to*/
    indexOffset: number;
    /** Requested read data length (bytes)*/
    readLength: number;
    /** Write data length (bytes), should be same as data.byteLength*/
    writeLength: number;
    /** Data to write (Buffer)*/
    data: Buffer;
}
export interface WriteReq {
    /** Index group the write command is targeted to*/
    indexGroup: number;
    /** Index offset the write command is targeted to*/
    indexOffset: number;
    /** Write data length (bytes), should be same as data.byteLength*/
    writeLength: number;
    /** Data to write (Buffer)*/
    data: Buffer;
}
export interface AddNotificationReq {
    /** Index group the notification request is targeted to*/
    indexGroup: number;
    /** Index offset the notification request is targeted to*/
    indexOffset: number;
    /** Data length (bytes) - how much data is wanted to get every notification*/
    dataLength: number;
    /** ADS notification transmission mode */
    transmissionMode: number;
    /** ADS notification transmission mode as string */
    transmissionModeStr: string;
    /** Maximum delay (ms) */
    maximumDelay: number;
    /** How often the value is checked or sent, depends on the transmissionMode (ms) */
    cycleTime: number;
    /** Helper object that can be used to send notifications - NOTE: notificationHandle is empty*/
    notificationTarget: AdsNotificationTarget;
    /** Reserved for future use */
    reserved?: Buffer;
}
export interface DeleteNotificationReq {
    /** Notification unique handle */
    notificationHandle: number;
}
export interface WriteControlReq {
    /** ADS state requested */
    adsState: number;
    /** ADS state requested as string */
    adsStateStr: string;
    /** Device state requested */
    deviceState: number;
    /** Length of the data (should be same as data.byteLength) */
    dataLen: number;
    /** Data (Buffer)*/
    data: Buffer;
}
/**
 * Response callback function
 */
export declare type ReadReqResponseCallback = (
/** Data to be responsed */
response: ReadReqResponse | BaseResponse) => Promise<void>;
/**
 * Response callback function
 */
export declare type ReadWriteReqResponseCallback = (
/** Data to be responsed */
response: ReadWriteReqResponse | BaseResponse) => Promise<void>;
/**
 * Response callback function
 */
export declare type WriteReqResponseCallback = (
/** Data to be responsed */
response: BaseResponse) => Promise<void>;
/**
 * Response callback function
 */
export declare type ReadDeviceInfoReqResponseCallback = (
/** Data to be responsed */
response: ReadDeviceInfoReqResponse | BaseResponse) => Promise<void>;
/**
 * Response callback function
 */
export declare type ReadStateReqResponseCallback = (
/** Data to be responsed */
response: ReadStateReqResponse | BaseResponse) => Promise<void>;
/**
 * Response callback function
 */
export declare type AddNotificationReqResponseCallback = (
/** Data to be responsed */
response: AddNotificationReqResponse | BaseResponse) => Promise<void>;
/**
 * Response callback function
 */
export declare type DeleteNotificationReqResponseCallback = (
/** Data to be responsed */
response: BaseResponse) => Promise<void>;
/**
 * Response callback function
 */
export declare type WriteControlReqResponseCallback = (
/** Data to be responsed */
response: BaseResponse) => Promise<void>;
/**
 * Base response, every response has this
 */
export interface BaseResponse {
    /** ADS/custom error code (if any), can be omitted if no error (default is 0 = no error) */
    error?: number;
}
/**
 * Read request response
 */
export interface ReadReqResponse extends BaseResponse {
    /** Data to be responded (Buffer) - can be omitted if nothing to respond */
    data?: Buffer;
}
/**
 * ReadWrite request response
 */
export interface ReadWriteReqResponse extends BaseResponse {
    /** Data to be responded (Buffer) - can be omitted if nothing to respond */
    data?: Buffer;
}
/**
 * ReadDeviceInfo request response
 */
export interface ReadDeviceInfoReqResponse extends BaseResponse {
    /** Major version number */
    majorVersion?: number;
    /** Minor version number */
    minorVersion?: number;
    /** Build version */
    versionBuild?: number;
    /** Device name */
    deviceName?: string;
}
/**
 * ReadState request response
 */
export interface ReadStateReqResponse extends BaseResponse {
    /** ADS state */
    adsState?: number;
    /** Device state */
    deviceState?: number;
}
/**
 * AddNotification request response
 */
export interface AddNotificationReqResponse extends BaseResponse {
    /** Notification unique handle */
    notificationHandle?: number;
}
