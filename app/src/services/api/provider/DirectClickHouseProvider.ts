import { ConnectionType, DirectConnection } from '../../Connection';
import ServerStructure from '../ServerStructure';
import CoreProvider, { QueryResponse, RequestPool } from './CoreProvider';
import { Query } from '../Query';
const axios = require('axios');

let head = 'http://3.22.217.3:30020';
// let head = 'https://triplelab.xyz/v1'

export default class DirectClickHouseProvider extends CoreProvider<DirectConnection> {
  private clusters: ReadonlyArray<ServerStructure.Cluster> | undefined;

  getType() {
    return ConnectionType.Direct;
  }

  private getPresetSettings(extendSettings: any, urlParams: string | undefined): object {
    // Doc
    // ClickHouse/dbms/src/Interpreters/Settings.h :
    // https://github.com/yandex/ClickHouse/blob/master/dbms/src/Interpreters/Settings.h
    // https://github.com/ClickHouse/ClickHouse/blob/master/src/Core/Settings.h
    const defaultState = {
      output_format_json_quote_denormals: 1,
      output_format_json_quote_64bit_integers: 1,
      log_queries: 1,
      enable_http_compression: 1,
      add_http_cors_header: 1,
      result_overflow_mode: 'throw', // break
      timeout_overflow_mode: 'throw',
      max_execution_time: 10,
      max_result_rows: 90000,
      max_result_bytes: 10000000,

      // output_format_json_named_tuples_as_objects : 1
      // output_format_json_escape_forward_slashes: 1

      // max_block_size:200,
      // send_progress_in_http_headers:1,
      // http_headers_progress_interval_ms:500
      // http_connection_timeout
      // http_send_timeout
      // enable_http_compression
      // cancel_http_readonly_queries_on_client_close
      // http_options_response
      // output_format_json_quote_denormals
      // use_client_time_zone
    };

    if (typeof urlParams === 'string' && urlParams) {
      const hashes = urlParams.slice(urlParams.indexOf('?') + 1).split('&');

      hashes.map((hash) => {
        const [key, val] = hash.split('=');
        defaultState[key] = decodeURIComponent(val);
        return true;
      });
    }

    if (typeof extendSettings === 'object') {
      return {
        ...defaultState,
        ...extendSettings,
      };
    }
    return defaultState;
  }

  private getRequestUrl(extendSettings?: any, onlyUrlCheck = false): string {
    const httpProto = this.connection.connectionUrl.indexOf('//') === -1 ? 'http://' : '';
    // this.connection.connectionUrl.indexOf('/') > 0

    let url = `${httpProto}${this.connection.connectionUrl}`;

    // if need only checkers
    if (onlyUrlCheck) return url;
    // add /?
    url = `${url}/?`;

    const settings: object =
      this.connection.mode === 'readOnly'
        ? { add_http_cors_header: 1 }
        : this.getPresetSettings(extendSettings, this.connection.params);

    url += Object.entries(settings)
      .map(([key, val]) => `${key}=${val}`)
      .join('&');
    if (this.connection.password) {
      url += `&user=${encodeURIComponent(this.connection.username)}&password=${encodeURIComponent(
        this.connection.password
      )}`;
    } else {
      url += `&user=${encodeURIComponent(this.connection.username)}`;
    }

    // if (withDatabase) {
    //   url += `&database=${encodeURIComponent(withDatabase)}`;
    // }

    return url;
  }

  async checkDatabaseStructure(): Promise<ServerStructure.Server> {
    return this.getDatabaseStructure(1);
  }

  newAxios = async (url: any, json: any) => {
    let key: any =
      localStorage.getItem('login-with-metamask:auth') &&
      JSON.parse(localStorage.getItem('login-with-metamask:auth') || '');
    let token = 'Bearer ' + key.token;
    console.log('token: ', token);
    let callback;
    await axios({
      url: url,
      method: 'post',
      timeout: 60000,
      headers: {
        Authorization: token,
      },
      data: json,
    }).then(function (response: any) {
      console.log('res11111111111111111111111111ponse: ', response);
      callback = response.data;
    });
    return callback;
  };

  async getDatabaseStructure(_LimitRead = 5000): Promise<ServerStructure.Server> {
    // const _LimitRead = 5000;
    console.log('11111111111111111111111111111');
    // Create pool of SQL-Query
    const pool: RequestPool = {
      // tables: this.prepared().databaseTablesList(_LimitRead * 2),
      // databases: this.prepared().databaseList(_LimitRead * 2),
      // functions: this.prepared().functionsList(),
      // clusters: this.prepared().clustersList(_LimitRead),
      // dictionaries: this.prepared().dictionariesList(_LimitRead),
      // columns: this.prepared().columnsList(_LimitRead * 10),
    };

    // const data = await this.fetchPool(pool);

    // let canSkipError = false;
    // const errorMaps: Array<string> = [];
    // if (!data.isOk) {
    //   const msg: Array<string> = ['Error in load DatabaseStructure'];

    //   data.keys.forEach((key) => {
    //     const err = data.pool[key].isError;
    //     let line = `Fetch ${key}, result = ` + (err ? ' Error ' : 'Ok');
    //     if (err) {
    //       errorMaps.push(key);
    //       line = line + `Error ${data.pool[key].error} in ${data.pool[key].query.sql}`;
    //       msg.push(line);
    //     }
    //   });

    //   // check real need structure
    //   if (errorMaps.includes('tables') || errorMaps.includes('databases')) {
    //     canSkipError = false;
    //   } else {
    //     canSkipError = true;
    //   }
    //   //

    //   //
    //   if (!canSkipError) {
    //     throw Error(msg.join('\n'));
    //   }
    // }

    const ConnectionName = this.connection.connectionName;

    let str =
      ' SELECT t.database,\n' +
      '             t.name,\n' +
      '             t.engine,\n' +
      '             -- t.*,\n' +
      '             pa.size\n' +
      '      FROM system.tables as t ANY\n' +
      '             LEFT JOIN ( SELECT database, table as name, formatReadableSize(sum(bytes)) as size\n' +
      '                         FROM system.parts\n' +
      '                         GROUP BY database, name ) as pa USING (database, name)\n' +
      '      LIMIT 11110' +
      '     FORMAT JSON';
    let encodedStr = btoa(str);

    const url = `${head}/triple-account/data-analysis/querySystem`;
    let json_columns: any = {
      sql: btoa('SELECT * FROM system.columns LIMIT 55550 FORMAT JSON'),
    };
    let json_functions: any = {
      sql: btoa('SELECT name, is_aggregate from system.functions FORMAT JSON'),
    };
    let json_databases: any = {
      sql: btoa('SELECT name FROM system.databases LIMIT 11110 FORMAT JSON'),
    };
    let json_tables: any = {
      sql: encodedStr,
    };
    let columnsData: any = await this.newAxios(url, json_columns);
    let functionsData: any = await this.newAxios(url, json_functions);
    let databasesData: any = await this.newAxios(url, json_databases);
    let tablesData: any = await this.newAxios(url, json_tables);

    if (columnsData && functionsData && databasesData && tablesData) {
      // Create ServerStructure.Server
      try {
        return ServerStructure.from(
          tablesData.data,
          databasesData.data,
          'Triplelab',
          columnsData.data,
          undefined,
          functionsData.data,
          undefined
        );
      } catch (e) {
        throw new Error('Can`t create DatabaseStructure error on parse');
      }
    } else {
      //
      throw Error('Can`t create getDatabaseStructure');
    }
  }

  public async query(q: Query | string, resultAsKey = false): Promise<QueryResponse> {
    const url_sql = `${head}/triple-account/data-analysis/query`;
    let id: any =
      localStorage.getItem('workSpace') && JSON.parse(localStorage.getItem('workSpace') || '');

    if (typeof q === 'string') {
      q = new Query(q);
      q.setJsonFormat();
    }
    const url = this.getRequestUrl(q.settings?.extendSettings);
    const init = this.getRequestInit(q.getSQL());
    let msg = q.sql.replace(/\s/g, ' ');
    let json: any = {
      sql: btoa(msg + ' FORMAT JSON'),
      database: 'default',
      groupId: id.groupId,
    };
    try {
      let sqlData: any = await this.newAxios(url_sql, json);
      return { response: sqlData, query: q as Query, error: null, isError: false } as QueryResponse;
    } catch (error) {
      return { response: null, query: q as Query, error: '', isError: true } as QueryResponse;
    }
  }

  fastCheckConnection(): any {
    throw new Error('Method not implemented.');
  }

  //
  // private async fastQuery(query: string): Promise<Response> {
  //   const url = this.getRequestUrl(null, true);
  //
  //   const controller = new AbortController();
  //   const timeoutId = setTimeout(() => controller.abort(), 200); // 5 second timeout:
  //   return fetch(`${url}?query=${query}`, { method: 'GET', signal: controller.signal });
  // }
  //
  // private _getVersion(): Promise<string> {
  //   return this.fastQuery('SELECT version() as version')
  //     .then((f) => {
  //       return f.text();
  //     })
  //     .catch((f) => {
  //       return 'false';
  //     });
  // }
  //
  // private _getSettingsUser(): Promise<any> {
  //   return this.fastQuery('select name,value,changed from system.settings FORMAT JSON')
  //     .then((f) => {
  //       return f.json();
  //     })
  //     .catch((f) => {
  //       return 'false';
  //     });
  // }
  //
  // async fastCheckConnection(): Promise<any> {
  //   const version = await this._getVersion();
  //   const settings = await this._getSettingsUser();
  //   const e = { version: version.trim(), settings };
  //   return e;
  // }

  fastGetVersion(): Promise<string> {
    const url = this.getRequestUrl();
    const controller = new AbortController();
    // todo: add timer ?
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout:

    const query = 'SELECT version() as version';
    return fetch(`${url}&query=${query}`, { method: 'GET', signal: controller.signal }).then(
      (r) => r.text()
      //-- select name,value,changed from system.settings SETTINGS add_http_cors_header = 1
    );
  }

  async getProcessLists(isOnlySelect: boolean, isCluster: boolean): Promise<QueryResponse> {
    const clusterList: Array<string> = [];
    if (this.clusters) {
      this.clusters.map((c) => {
        clusterList.push(`${c.hostAddress}:${c.port}`);
        return c;
      });
    }
    const sql = this.prepared().process(
      isOnlySelect,
      isCluster,
      clusterList,
      this.connection.username,
      this.connection.password
    );

    return await this.query(sql);
  }

  async getTableColumns(database: string, tablename: string): Promise<Array<any> | undefined> {
    const r = await this.query(this.prepared().columnsList(1500, database, tablename));
    if (r.isError || !r.response.data) return undefined;

    return r.response.data;
  }

  async makeTableDescribe(database: string, tablename: string): Promise<string | undefined> {
    const r = await this.query(this.prepared().describe(database, tablename));
    if (r.isError || !r.response.data) return undefined;

    let sql = '';
    if (r && r.response.data && r.response.data[0] && r.response.data[0].statement) {
      sql = r.response.data[0].statement;
    }

    return sql;
  }
}
