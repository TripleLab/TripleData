import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { observer } from 'mobx-react';
import { Flex } from 'reflexy';
import { typedInject } from 'module/mobx-utils';
import { ServerStructure } from 'services';
import { routePaths } from 'routes';
import { Modal, Dropdown, Menu } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import { Stores, TabsStore, TreeStore } from 'stores';
import logo from '../../assets/images/logo_tripleDB.png'
import {
  DbOverviewTab,
  EditorTabModel,
  isTabOfType,
  MetricsTabModel,
  ProcessesTabModel,
  ServerOverviewTab,
  SqlHistoryTab,
  Tab,
  TableViewTabModel,
  TabType,
} from 'models';

import {
  CodeOutlined,
  DatabaseOutlined,
  HddOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  TableOutlined,
} from '@ant-design/icons';

import {
  DbOverviewTabPage,
  EditorTabPage,
  MetricsTabPage,
  NavPrompt,
  ProcessesTabPage,
  ServerOverviewTabPage,
  ServerStructureTree,
  SqlHistoryTabPage,
  TableViewTabPage,
  Tabs,
  TabsTabPane,
} from 'components/Dashboard';
import { TextInsertType } from 'components/Dashboard/EditorTabPage';
import Page from 'components/Page';
import { ActionType } from 'components/Dashboard/Tabs';
import {
  ColumnAction,
  RowActionTypeAction,
  ServerAction,
  TableAction,
} from 'components/Dashboard/ServerStructureTree';
import Splitter from 'components/Splitter';
import css from './DashboardView.css';
interface InjectedProps {
  treeStore: TreeStore;
  tabsStore: TabsStore;
}

export type Props = InjectedProps;

export enum TabRightMenuAction {
  CloseOther = 'CloseOther',
  CloseAll = 'CloseAll',
  CloseCurrent = 'Close',
  CloseLeft = 'CloseLeft',
  CloseRight = 'CloseRight',
  PinTab = 'PIN',
}

type RoutedProps = Props & RouteComponentProps<any>;

@observer
class DashboardView extends React.Component<RoutedProps> {
  componentDidMount() {
    this.props.tabsStore.loadData();
  }

  private onServerAction = (action: ServerAction) => {
    switch (action) {
      case ServerAction.OpenProcesses: {
        this.props.tabsStore.openProcessesTab();
        break;
      }
      case ServerAction.OpenMetrics: {
        this.props.tabsStore.openMetricsTab();
        break;
      }
      case ServerAction.OpenServerOverview: {
        this.props.tabsStore.openServerOverviewTab();
        break;
      }
      case ServerAction.OpenDbOverview: {
        this.props.tabsStore.openDbOverviewTab();
        break;
      }
      case ServerAction.OpenSqlHistory: {
        this.props.tabsStore.openSqlHistoryTab();
        break;
      }
      default:
        break;
    }
  };

  private onTableAction = (action: TableAction, table: ServerStructure.Table) => {
    // https://github.com/tabixio/tabix/blob/master/src/app/base/sidebar.js#L233
    switch (action) {
      case TableAction.OpenTable:
        this.props.tabsStore.openTableTab(table);
        break;
      case TableAction.CodeSelectFrom:
        this.props.tabsStore.insertSelectFrom(table);
        break;
      case TableAction.MakeSQLDescribe:
        this.props.tabsStore.insertTableSQLDescribe(table);
        break;
      case TableAction.InsertTableName:
        this.props.tabsStore.insertTextToEditor(table.name, TextInsertType.Table);
        break;
      default:
        break;
    }
  };

  // (action: RowActionTypeAction, column: ServerStructure.SpecialItem)
  private onCommandAction = (action: RowActionTypeAction, command: ServerStructure.SpecialItem) => {
    if (action === RowActionTypeAction.DoubleClick || action === RowActionTypeAction.Click) {
      switch (command.command) {
        case ServerStructure.PagesCommands.Processes: {
          this.props.tabsStore.openProcessesTab();
          break;
        }
        case ServerStructure.PagesCommands.Metrics: {
          this.props.tabsStore.openMetricsTab();
          break;
        }
        case ServerStructure.PagesCommands.ServerOverview: {
          this.props.tabsStore.openServerOverviewTab();
          break;
        }
        // case ServerStructure.PagesCommands.DbOverview: {
        //   this.props.tabsStore.openDbOverviewTab();
        //   break;
        // }
        case ServerStructure.PagesCommands.SqlHistory: {
          this.props.tabsStore.openSqlHistoryTab();
          break;
        }
        default:
          break;
      }

      // this.props.tabsStore.insertColumnToEditor(column);
    }
  };

  private onColumnAction = (action: ColumnAction, column: ServerStructure.Column) => {
    if (action === ColumnAction.DoubleClick || action === ColumnAction.Click) {
      this.props.tabsStore.insertColumnToEditor(column);
    }
  };

  private onEditTabs = (
    eventOrKey: string | React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>,
    action: 'remove' | 'add'
  ) => {
    const { tabsStore: store } = this.props;
    if (action === 'remove' && typeof eventOrKey === 'string') {
      store.removeTab(eventOrKey);
    } else if (action === 'add') {
      store.openNewEditorTab();
    }
  };

  private onMenuAction = (action: ActionType) => {
    switch (action) {
      case ActionType.SignOut: {
        const { history } = this.props;
        // history.push(routePaths.signOut.path);
        break;
      }
      case ActionType.Help: {
        // Create Modal help
        break;
      }

      default:
        break;
    }
  };

  private onClickTabRightMenu = ({ key }: MenuInfo) => {
    const { tabsStore: store } = this.props;
    const k = key.split('#');
    const tabId = k[1];
    switch (k[0]) {
      case TabRightMenuAction.CloseLeft: {
        store.closeTabsDirection(tabId, true);
        break;
      }
      case TabRightMenuAction.CloseRight: {
        store.closeTabsDirection(tabId, false);
        break;
      }
      case TabRightMenuAction.CloseAll: {
        store.closeTabsAll(tabId);
        break;
      }
      case TabRightMenuAction.CloseOther: {
        store.closeTabsOthers(tabId);
        break;
      }
      case TabRightMenuAction.CloseCurrent: {
        store.closeTab(tabId);
        break;
      }
      default:
        break;
    }
  };

  private getTabIcon = (tab: Tab): JSX.Element => {
    if (tab.type === TabType.Processes) return <HddOutlined />;
    if (tab.type === TabType.Metrics) return <LineChartOutlined />;
    if (tab.type === TabType.DbOverview) return <RadarChartOutlined />;
    if (tab.type === TabType.TableView) return <TableOutlined />;
    if (tab.type === TabType.ServerOverview) return <DatabaseOutlined />;
    return <CodeOutlined />;
  };

  render() {
    const { tabsStore, treeStore } = this.props;
    const { uiStore } = tabsStore;
    const isBlocking = tabsStore
      .getActiveTabOfType<EditorTabModel>(TabType.Editor)
      .map((t) => !!t.content)
      .getOrElse(false);

    const tabRightMenu = (id: string) => (
      <Menu onClick={this.onClickTabRightMenu}>
        <Menu.Item key={`${TabRightMenuAction.CloseCurrent}#${id}`}>Close</Menu.Item>
        <Menu.Item key={`${TabRightMenuAction.CloseOther}#${id}`}>Close other</Menu.Item>
        <Menu.Item key={`${TabRightMenuAction.CloseAll}#${id}`}>Close all</Menu.Item>
        <Menu.Item key={`${TabRightMenuAction.CloseLeft}#${id}`}>Close left</Menu.Item>
        <Menu.Item key={`${TabRightMenuAction.CloseRight}#${id}`}>Close right</Menu.Item>
        {/*<Menu.Item key={`${TabRightMenuAction.PinTab}#${id}`}>Pin tab</Menu.Item>*/}
      </Menu>
    );
    console.log('tabsStore.tabs: ', tabsStore.tabs);

    return (
      <>
        <Page column={false} uiStore={tabsStore.uiStore}>
          <div
            style={{
              height: '70px',
              background: '#282F3E',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img src={logo} alt="" style={{ height: '40px', marginLeft: '30px' }} />
          </div>
          <div
            style={{
              height: '12px',
              background: '#1D1D1D',
            }}
          ></div>
          <NavPrompt when={isBlocking} message="Do you want to leave this page?" />

          <div
            style={{
              display: 'flex',
              flex: '1 1',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Splitter
              primary="second"
              minSize={950}
              maxSize={-396}
              defaultSize="calc(100vw - 396px)"
              size={uiStore.primaryPaneSize}
              onDragFinished={uiStore.updatePrimaryPaneSize}
            >
              <Flex alignItems="flex-start" vfill className={css['sider-container']}>
                <ServerStructureTree
                  onServerAction={this.onServerAction}
                  onTableAction={this.onTableAction}
                  onColumnAction={this.onColumnAction}
                  onCommandAction={this.onCommandAction}
                />
              </Flex>
              <Flex fill={true} column hfill className={css.baseContent}>
                <Tabs
                  activeKey={tabsStore.activeTab.map((_) => _.id).orUndefined()}
                  onEdit={this.onEditTabs}
                  onChange={tabsStore.setActiveTab}
                  onMenuAction={this.onMenuAction}
                  style={{ height: '100%' }}
                >
                  {tabsStore.tabs.map((t) => (
                    <TabsTabPane
                      // style={{ background: 'red' }}
                      key={t.id}
                      closable
                      tab={
                        <Dropdown overlay={tabRightMenu(t.id)} trigger={['contextMenu']}>
                          <span>
                            {this.getTabIcon(t)}
                            {t.title}
                          </span>
                        </Dropdown>
                      }
                    >
                      {/* minHeight: '86vh', maxHeight: '86vh', */}
                      <Flex
                        fill={true}
                        column
                        hfill
                        style={{ background: '#282F3E', height: '100%', position: 'relative' }}
                      >
                        {isTabOfType<EditorTabModel>(t, TabType.Editor) && (
                          <EditorTabPage
                            store={tabsStore}
                            serverStructure={treeStore.serverStructure.orUndefined()}
                            model={t}
                            onModelFieldChange={t.changeField}
                            width={uiStore.primaryPaneSize}
                          />
                        )}

                        {isTabOfType<TableViewTabModel>(t, TabType.TableView) && (
                          <TableViewTabPage
                            serverStructure={treeStore.serverStructure.orUndefined()}
                            model={t}
                          />
                        )}

                        {isTabOfType<ProcessesTabModel>(t, TabType.Processes) && (
                          <ProcessesTabPage />
                        )}

                        {isTabOfType<MetricsTabModel>(t, TabType.Metrics) && <MetricsTabPage />}

                        {isTabOfType<ServerOverviewTab>(t, TabType.ServerOverview) && (
                          <ServerOverviewTabPage store={tabsStore} />
                        )}

                        {isTabOfType<DbOverviewTab>(t, TabType.DbOverview) && <DbOverviewTabPage />}

                        {isTabOfType<SqlHistoryTab>(t, TabType.SqlHistory) && (
                          <SqlHistoryTabPage onEdit={tabsStore.openNewEditorTab} />
                        )}
                      </Flex>
                    </TabsTabPane>
                  ))}
                </Tabs>
              </Flex>
            </Splitter>
          </div>
        </Page>
      </>
    );
  }
}

export default withRouter(
  typedInject<InjectedProps, RoutedProps, Stores>(({ store }) => ({
    tabsStore: store.tabsStore,
    treeStore: store.treeStore,
  }))(DashboardView)
);
