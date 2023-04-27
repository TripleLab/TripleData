import React, { memo } from 'react';
import { observer } from 'mobx-react';
import { Option } from 'funfix-core';
import { FieldChangeHandler } from 'module/mobx-utils';
import { EditorTab } from 'models';
import { TabsStore } from 'stores';
import { ServerStructure } from 'services';
import DataDecorator from 'services/api/DataDecorator';
import Splitter from 'components/Splitter';
import SqlEditor from './SqlEditor';
import { ActionType as EditorActionType } from './SqlEditor/Toolbar';
import { TextInsertType } from './SqlEditor/types';
import SaveModal from './SaveModal';
import { Tabs, ResultTabActionType } from './Tabs';
import DataItemsLayout from './DataItemsLayout';
// import DataTable, { ExportData, DataTableProps, ResultTableActionType } from './DataTable';
import { TableSheet } from 'components/TableSheet';
import Draw from 'components/Draw';
import Progress from './Progress';
import { TabsTabPane } from './Tabs/Tabs';
import FullScreener from './FullScreener';
import { color } from 'echarts';
// import { Table } from 'antd';
import { Table, Pagination } from '@douyinfe/semi-ui';
import './EditorTabPage.css';
import RequestStats from '../EditorTabPage/RequestStats';
import { Statistics } from 'services/api/DataDecorator';
import { Spin } from 'antd';
import { format } from 'sql-formatter';
import { Button, Modal, Input } from 'antd';
import Cancel from '../../../assets/images/Cancel.svg';
import { newAxios } from 'components/axios';
import { notification } from 'antd';
interface Props {
  store: TabsStore;
  serverStructure?: ServerStructure.Server;
  model: EditorTab;
  onModelFieldChange: FieldChangeHandler<EditorTab>;
  width?: number;
}

let h = document.documentElement.clientHeight;
let he = h - 600;

@observer
export default class EditorTabPage extends React.Component<any, any> {
  constructor(props: Props | Readonly<Props>) {
    super(props);
    const { model } = this.props;
    this.state = {
      enterFullScreen: false,
      height: he,
      pageSize: 50,
      page: 1,
      code: model.content,
      modalOpen: false,
      queryName: '',
      queryDescription: '',
      queryName_error: '',
      queryDescription_error: '',
      newCode: '',
      loading: false,
    };
  }
  stats?: Statistics;
  private onContentChange = (content: string) => {
    this.props.onModelFieldChange({ name: 'content', value: content });
  };

  private onDatabaseChange = (db: ServerStructure.Database) => {
    this.props.onModelFieldChange({ name: 'currentDatabase', value: Option.of(db.name) });
  };

  private setEditorRef = (editor: SqlEditor | null) => {
    this.props.onModelFieldChange({ name: 'codeEditor', value: Option.of(editor) });
  };

  private onEditorAction = (action: EditorActionType, eventData?: any) => {
    switch (action) {
      case EditorActionType.Save: {
        const { store } = this.props;
        store.showSaveModal();
        break;
      }
      case EditorActionType.Fullscreen:
        break;
      case EditorActionType.RunCurrent:
      case EditorActionType.RunAll: {
        const { store } = this.props;
        store.execQueries(eventData);
        break;
      }
      default:
        break;
    }
  };

  private onResultTabAction = (action: ResultTabActionType, subEvent = '') => {
    const { model } = this.props;
    switch (action) {
      case ResultTabActionType.TogglePin: {
        const { onModelFieldChange: onTabModelFieldChange, model } = this.props;
        onTabModelFieldChange({ name: 'pinnedResult', value: !model.pinnedResult });
        break;
      }
      case ResultTabActionType.Fullscreen: {
        const v = this.state.enterFullScreen;
        this.setState({ enterFullScreen: !v });
        console.log('FULLSCREEN', this.state.enterFullScreen);
        break;
      }
      default:
        break;
    }
  };

  private copyToClipboard(text: string) {
    // const textarea = React.createElement(
    //   'textarea',
    //   { value: text, type: 'url', autoFocus: true },
    //   'body'
    // );
    const textarea: HTMLTextAreaElement = document.createElement('textarea');
    // if (textarea.style) {
    // textarea.style.width = 0;
    // textarea.style.height = 0;
    // textarea.style.border = 0;
    // textarea.style.position = 'absolute';
    // textarea.style.top = 0;
    // }
    // textarea.innerText = text;
    document.body.appendChild(textarea);
    textarea.value = text;
    // textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.log('Oops, unable to copy');
    }
    document.body.removeChild(textarea);
    console.log(text);
    return true;
  }

  private renderTable = (data: DataDecorator) => <TableSheet data={data} />;

  private renderDraw = (data: DataDecorator) => <Draw data={data} fill />;

  private onResizeGrid = () => {
    //
    console.log('on Resize Grid');
    //
  };

  componentDidMount(): void {
    let local = localStorage.getItem('code');
    console.log('local: ', local);
    if (local) {
      this.setState(
        {
          code: atob(local),
        },
        () => {
          console.log('deldeldeldeldeldedledeldedledeldel');
          localStorage.removeItem('code');
        }
      );
    }
  }

  render() {
    const { store, serverStructure, model, width } = this.props;
    const resultList = model.queriesResult.map((r: { list: any }) => r.list).getOrElse([]);

    const formatCode = () => {
      this.setState({
        code: format(model.content, { language: 'mysql' }),
      });
    };

    const saveCallback = (selectCode: any) => {
      this.setState({
        modalOpen: true,
        newCode: selectCode ? selectCode : '',
      });
    };

    const close = async (e: any) => {
      if (e) {
        if (!this.state.queryName) {
          this.setState({
            queryName_error: true,
          });
        }
        if (!this.state.queryDescription) {
          this.setState({
            queryDescription_error: true,
          });
        }
        if (this.state.queryName && this.state.queryDescription) {
          let json = {
            name: this.state.queryName,
            description: this.state.queryDescription,
            querySql: this.state.newCode ? btoa(this.state.newCode) : btoa(model.content),
          };
          this.setState({
            loading: true,
          });
          const save_sql = `triple-account/data-analysis/saveSql`;
          try {
            let data: any = await newAxios(save_sql, json);
            if (data.data) {
              notification.open({
                message: 'save',
                description: 'success!',
                duration: 5,
              });
              this.setState({
                modalOpen: false,
                queryDescription_error: false,
                queryName_error: false,
                queryName: '',
                queryDescription: '',
                loading: false,
              });
            }
          } catch (error) {
            console.log('error: ', error);
          }
        }
      } else {
        this.setState({
          modalOpen: false,
          queryDescription_error: false,
          queryName_error: false,
          loading: false,
          // queryName: '',
          // queryDescription: '',
        });
      }
    };

    // const handleRow = (record: any, index: any) => {
    //   // 给偶数行设置斑马纹
    //   if (index % 2 === 0) {
    //     return {
    //       style: {
    //         background: '#16161a',
    //       },
    //     };
    //   } else {
    //     return {};
    //   }
    // };

    let data = resultList[0]?.result.value;
    let t = JSON.stringify(data);
    let stats: any = {
      timeElapsed: 0,
      rowsRead: 0,
      bytesRead: 0,
    };
    let dataList = [];
    let columns: any[] = [];
    if (t) {
      dataList = JSON.parse(t).rows;
      stats = JSON.parse(t).stats;
      columns = JSON.parse(t).meta.columns.map((e: { name: any }) => {
        return {
          title: e.name,
          dataIndex: e.name,
          // ellipsis:true,
          width: 200,
          textWrap: 'none',
          // render: (_: any, record: any) => (
          //   <div style={{ whiteSpace: 'nowrap' }}>{record[e.name]}</div>
          // ),
        };
      });
    }
    let h;
    const watchWindowSize = () => {
      let h2 = document.documentElement.clientHeight;
      let he2 = h2 - 600;
      if (he2 !== this.state.height) {
        this.setState({
          height: he2,
        });
      }
    };
    window.addEventListener('resize', watchWindowSize);

    const paginationFun = (list: []) => {
      let page = this.state.page;
      let pageSize = this.state.pageSize;
      let spList = [];
      for (let i = 0; i < list.length; i += pageSize) {
        spList.push(list.slice(i, i + pageSize));
      }
      return spList[page - 1];
    };

    return (
      <React.Fragment>
        <Splitter split="horizontal" minSize={100} defaultSize={300}>
          <SqlEditor
            content={this.state.code}
            onContentChange={this.onContentChange}
            serverStructure={serverStructure}
            currentDatabase={model.currentDatabase.getOrElse('')}
            onDatabaseChange={this.onDatabaseChange}
            onAction={this.onEditorAction}
            stats={model.queriesResult.map((_: { totalStats: any }) => _.totalStats).orUndefined()}
            ref={this.setEditorRef}
            formatCode={formatCode}
            saveCallback={saveCallback}
            store={store}
            fill
          />
          <div
            style={{
              padding: '10px 20px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ color: '#ffffff', fontSize: '18px', opacity: '0.8' }}>Result</div>
              {stats && (
                <RequestStats
                  bytesRead={stats?.bytesRead}
                  timeElapsed={stats?.timeElapsed}
                  rowsRead={stats?.rowsRead}
                />
              )}
            </div>
            <Spin
              tip="Loading..."
              spinning={!!store.uiStore.executingQueries.length}
              style={{
                display: 'flex',
                flex: '1 1',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {resultList.length > 0 && dataList.length > 0 && (
                // <DataItemsLayout
                //   onResize={this.onResizeGrid}
                //   cols={4}
                //   itemWidth={4}
                //   itemHeight={10}
                //   items={resultList}
                //   width={width}
                //   renderItem={this.renderTable}
                //   locked={model.pinnedResult}
                // />
                //class="result-wrapper"
                //class="result-table"
                <div
                  style={{
                    display: 'flex',
                    flex: '1 1',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* height: this.state.height, */}
                  <div style={{ overflowY: 'scroll', marginBottom: '8px' }} className="table_box">
                    <table
                      style={{
                        borderCollapse: 'collapse',
                        position: 'relative',
                      }}
                      className="table_pagination"
                    >
                      <thead style={{ top: '0', position: 'sticky' }}>
                        <tr>
                          {columns.map((e: any, key: any) => {
                            return <th key={key}>{e.title}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {paginationFun(dataList).map((k: any, key: any) => (
                          <tr key={key}>
                            {columns.map((v: any, key: any) => (
                              <td key={key}>{k[v.dataIndex]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    total={dataList.length}
                    showSizeChanger
                    pageSizeOpts={[50, 100, 200]}
                    showTotal
                    className="table_pagination"
                    pageSize={50}
                    onChange={(currentPage, pageSize) => {
                      this.setState({
                        pageSize: pageSize,
                        page: currentPage,
                      });
                    }}
                  ></Pagination>
                </div>
              )}
            </Spin>
          </div>
        </Splitter>

        <Modal
          centered
          visible={this.state.modalOpen}
          width={600}
          title={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 36px',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#291F4E' }}>
                Save SQL Queries
              </div>
              <img
                src={Cancel}
                alt=""
                style={{ height: '20px', cursor: 'pointer' }}
                onClick={() => close(0)}
              />
            </div>
          }
          footer={null}
          closable={false}
          bodyStyle={{
            borderRadius: '0px 0px 19px 19px',
            background: '#ffffff',
            padding: '0px 52px 39px 52px',
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#291F4E' }}>Query Name</div>
            <input
              placeholder="Input query name"
              id={'input_save'}
              style={{
                margin: '12px 0 14px 0',
                border: this.state.queryName_error ? '1px solid red' : '1px solid #E6E6E6',
              }}
              value={this.state.queryName}
              onChange={(e) => {
                this.setState({
                  queryName: e.target.value,
                  queryName_error: false,
                });
              }}
            />
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#291F4E' }}>
              Query Description
            </div>
            <input
              placeholder="Input query description"
              id={'input_save'}
              style={{
                margin: '12px 0 14px 0',
                border: this.state.queryDescription_error ? '1px solid red' : '1px solid #E6E6E6',
              }}
              value={this.state.queryDescription}
              onChange={(e) => {
                this.setState({
                  queryDescription: e.target.value,
                  queryDescription_error: false,
                });
              }}
            />
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#291F4E' }}>
              SQL Statement
            </div>
            <textarea
              id={'input_save'}
              disabled
              value={this.state.newCode ? this.state.newCode : model.content}
              style={{
                margin: '12px 0 14px 0',
                height: '136px',
                background: '#F2FAF9',
                paddingTop: '16px',
                color: '#35A37E',
                resize: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '30px',
              }}
            >
              <div
                style={{
                  height: '42px',
                  borderRadius: '8px',
                  border: '1px solid #2F3975',
                  color: '#2F3975',
                  fontSize: '14px',
                  lineHeight: '42px',
                  textAlign: 'center',
                  fontWeight: 400,
                  width: '48%',
                  cursor: 'pointer',
                }}
                onClick={() => close(0)}
              >
                Cancel
              </div>

              <div
                style={{
                  height: '42px',
                  borderRadius: '8px',
                  background: '#2F3975',
                  color: '#ffffff',
                  fontSize: '14px',
                  lineHeight: '42px',
                  textAlign: 'center',
                  fontWeight: 400,
                  width: '48%',
                  cursor: 'pointer',
                  opacity: this.state.loading ? '0.5' : '1',
                }}
                onClick={() => {
                  close(1);
                }}
              >
                Save
              </div>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}
