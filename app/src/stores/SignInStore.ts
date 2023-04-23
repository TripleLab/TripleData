import { History } from 'history';
import { action, observable, runInAction } from 'mobx';
import { Option } from 'funfix-core';
import { NotificationType, withRequest } from 'module/mobx-utils';
// import { FromLocationDescriptorObject } from 'module/react-auth';
import { Api, Connection, connectionsStorage, isDirectConnection, TabixUpdate } from 'services';
import { ConnectionModel } from 'models';
import { routePaths } from 'routes';
import ApiRequestableStore from './ApiRequestableStore';

interface iTabixUpdate {
  currentVersion: string;
  newVersion: string;
  link: string;
  needUpdate: boolean;
}

export default class SignInStore extends ApiRequestableStore {
  @observable
  selectedConnection: ConnectionModel = ConnectionModel.DirectEmpty;

  @observable
  connectionList: ReadonlyArray<ConnectionModel> = [];

  @observable
  tbxUpdate: iTabixUpdate = {
    currentVersion: '',
    link: '',
    newVersion: '',
    needUpdate: false,
  };

  @withRequest
  async loadConnections() {
    const list = await connectionsStorage.get();
    runInAction(() => {
      this.connectionList = list.map(ConnectionModel.of);
    });
  }

  getCurrentVersionTabix(): string {
    return TabixUpdate.getTabixBuildVersion();
  }

  @withRequest
  async checkVersionUpdateTabix() {
    const currentVersion = this.getCurrentVersionTabix();
    const v = await TabixUpdate.checkVersionUpdateTabix(undefined);

    runInAction(() => {
      try {
        this.tbxUpdate = {
          currentVersion,
          needUpdate: v.haveUpdate,
          link: v.link,
          newVersion: v.newVersion,
        };
        if (v.haveUpdate) {
          this.uiStore?.addNotification({
            type: NotificationType.info,
            text: 'Update Tabix, new version: ' + v.newVersion,
          });
        }
      } catch (e) {
        console.warn('Can`t check Tabix update');
      }
      return false;
    });
  }

  @action
  setSelectedConnection(connection: Connection) {
    this.selectedConnection = ConnectionModel.of(connection);
  }

  // todo: fix if name already exists
  private getNewConnectionName = () => `CONNECTION ${this.connectionList.length + 1}`;

  @withRequest.bound
  @action
  async addNewConnection() {
    const con = ConnectionModel.of({
      type: this.selectedConnection.type,
      connectionName: this.getNewConnectionName(),
    });
    this.connectionList = this.connectionList.concat(con);
    this.setSelectedConnection(con);
    await connectionsStorage.saveConnections(this.connectionList.map((_) => _.toJSON()));
  }

  @withRequest.bound
  @action
  async deleteSelectedConnection() {
    console.log('deleteSelectedConnection', this.selectedConnection);
    this.connectionList = this.connectionList.filter(
      (c) => c.connectionName !== this.selectedConnection.connectionName
    );
    this.setSelectedConnection(
      isDirectConnection(this.selectedConnection)
        ? ConnectionModel.DirectEmpty
        : ConnectionModel.ServerEmpty
    );
    await connectionsStorage.saveConnections(this.connectionList.map((_) => _.toJSON()));
  }
  GetQueryString = (name: any) => {
    var reg: any = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r: any = window.location.search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
    var context = '';
    if (r != null) context = decodeURIComponent(r[2]);
    reg = null;
    r = null;
    return context == null || context == '' || context == 'undefined' ? '' : context;
  };

  signIn(history: History) {
    return this.submit(this.selectedConnection, async () => {
      const api = await Api.connect(this.selectedConnection.toJSON());
      if(this.GetQueryString('code')){
        console.log('th', this.GetQueryString('code'));
        localStorage.setItem('code', this.GetQueryString('code'));
      }
      this.rootStore.appStore.updateApi(Option.of(api));
      const { state: { from: path } = { from: routePaths.home.path } } = history.location; //  as FromLocationDescriptorObject;
      // history.push(path);
    });
  }
}
