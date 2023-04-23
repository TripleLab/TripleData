import { Omit } from 'typelevel-ts';
import { ConnectionMode } from '../models';

export interface ConnectionLike {
  uuid?: string;
  connectionName: string;
  connectionUrl: string;
  username: string;
  password: string;
  version: string;
  mode?: ConnectionMode;
}

export enum ConnectionType {
  Direct = 'direct',
  Server = 'server',
}

export interface DirectConnection extends ConnectionLike {
  type: string;
  params?: string;
}

export interface ServerConnection extends ConnectionLike {
  type: string;
  configKey?: string;
}

type Connection = DirectConnection | ServerConnection;

export type ConnectionInit = Partial<Omit<Connection, 'type'>> & Pick<Connection, 'type'>;

export function isDirectConnection(connection: ConnectionInit): connection is DirectConnection {
  return connection.type === ConnectionType.Direct;
}

// Just to avoid warnings when reexporting types when compile with webpack and tsc module option is 'esnext'.
const Connection = {};

const GetQueryString = (name: any) => {
  console.log('window.location.search: ', window.location.search);
  var reg: any = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  var r: any = window.location.search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
  var context = '';
  if (r != null) context = decodeURIComponent(r[2]);
  reg = null;
  r = null;
  return context == null || context == '' || context == 'undefined' ? '' : context;
};

if(GetQueryString('code')){
  console.log('th', GetQueryString('code'));
  localStorage.setItem('code', GetQueryString('code'));
}
console.log('Connection: ', Connection);

export default Connection;
