import React from 'react';
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

interface Props {
  store: TabsStore;
  serverStructure?: ServerStructure.Server;
  model: EditorTab;
  onModelFieldChange: FieldChangeHandler<EditorTab>;
  width?: number;
}

@observer
export default class EditorTabPage extends React.Component<Props> {
  state = {
    enterFullScreen: false,
  };
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
    console.log('eventData: ', eventData);
    console.log('action: ', action);
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
      // case ResultTabActionType.Export: {
      //   let counter = 0;
      //   model.queriesResult.value?.list?.map((_) => {
      //     if (
      //       _.result.isSuccess() &&
      //       !_.result.value.isResultText &&
      //       !_.result.value.error &&
      //       _.result.value.isHaveData
      //     ) {
      //       counter++;
      //       const title = `ResultTable-${counter}-${model.title}`;
      //       ExportData(_.result.value, subEvent, title);
      //     }
      //   });
      //   break;
      // }
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

  //
  // private onDataTableAction: DataTableProps['onAction'] = (action, data) => {
  //   if (action === ResultTableActionType.Insert) {
  //     // to insert result to editor ( where cursor )
  //     console.log('insert result:');
  //     console.info(`%c${data}`, 'color: #bada55');
  //     const { model } = this.props;
  //     model.codeEditor.forEach((editor) => editor.insertText(data, TextInsertType.Sql));
  //   }
  //   if (action === ResultTableActionType.Show) {
  //     // to show result in elements
  //     console.log('show result:');
  //     console.info(`%c${data}`, 'color: #bada55');
  //     const { onModelFieldChange } = this.props;
  //     onModelFieldChange({ name: 'tableData', value: Option.of(data) });
  //   }
  //   if (action === ResultTableActionType.Clipboard) {
  //     // to clipboard text
  //     console.log('to Clipboard result:');
  //     console.info(`%c${data}`, 'color: #bada55');
  //     this.copyToClipboard(data);
  //   }
  // };

  private renderTable = (data: DataDecorator) => <TableSheet data={data} />;

  private renderDraw = (data: DataDecorator) => <Draw data={data} fill />;

  private onResizeGrid = () => {
    //
    console.log('on Resize Grid');
    //
  };

  render() {
    const { store, serverStructure, model, width } = this.props;
    const resultList = model.queriesResult.map((r) => r.list).getOrElse([]);
    console.log('resultList: ', resultList);

    const handleRow = (record: any, index: any) => {
      // 给偶数行设置斑马纹
      if (index % 2 === 0) {
        return {
          style: {
            background: '#16161a',
          },
        };
      } else {
        return {};
      }
    };

    let data = resultList[0]?.result.value;
    let t = JSON.stringify(data);
    let stats: any = {
      timeElapsed: 0,
      rowsRead: 0,
      bytesRead: 0,
    };
    let dataList = [];
    let columns = [];
    if (t) {
      console.log('t: ', JSON.parse(t).meta.columns);
      console.log('t: ', JSON.parse(t).rows);
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
    return (
      <React.Fragment>
        <Splitter split="horizontal" minSize={100} defaultSize={300}>
          <SqlEditor
            content={model.content}
            onContentChange={this.onContentChange}
            serverStructure={serverStructure}
            currentDatabase={model.currentDatabase.getOrElse('')}
            onDatabaseChange={this.onDatabaseChange}
            onAction={this.onEditorAction}
            stats={model.queriesResult.map((_) => _.totalStats).orUndefined()}
            ref={this.setEditorRef}
            fill
          />

          {/* position: 'absolute'  */}
          <div
            style={{
              padding: '10px 20px',
              display: 'flex',
              flexDirection: 'column',
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
            {/* {!!store.uiStore.executingQueries.length && ( */}
            {/* <Progress queries={store.uiStore.executingQueries} /> */}
            {/* )} */}
            {/* <>3333333</> */}
            {resultList.length > 0 && (
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
              <Table
                columns={columns}
                dataSource={dataList}
                // rowSelection={rowSelection}
                // onRow={handleRow}
                scroll={{ y: 300, x: 1200 }}
                pagination={{
                  pageSize: 50,
                  formatPageText: false,
                  showSizeChanger: true,
                  showTotal: true,
                  // showQuickJumper:true,
                  className: 'table_pagination',
                  pageSizeOpts: [50, 100, 200],
                  // style: {  color: '#ffffff' },
                }}
              />

              // <Table columns={columns} dataSource={dataList} scroll={{ x: 1500, y: 300 }} />
            )}

            {/* <div style={{ bottom: '0', position: 'absolute' }}>
                {' '}
                {resultList.length > 0 && (
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

                  <Table columns={columns} dataSource={dataList} scroll={{ x: 1500, y: 300 }} />
                )}
              </div> */}
          </div>

          {/* <div>
              {model.tableData.map((data) => <div>{data}</div>).orUndefined()}

              <Tabs
                defaultActiveKey="table"
                pinned={model.pinnedResult}
                onAction={this.onResultTabAction}
              >
                <TabsTabPane key="table" tab="Data" style={{ overflowY: 'auto' }}>
                  {!!store.uiStore.executingQueries.length && (
                    <Progress queries={store.uiStore.executingQueries} />
                  )}

                  <DataItemsLayout
                    onResize={this.onResizeGrid}
                    cols={4}
                    itemWidth={4}
                    itemHeight={10}
                    items={resultList}
                    width={width}
                    renderItem={this.renderTable}
                    locked={model.pinnedResult}
                  />
                </TabsTabPane>
              </Tabs>
            </div> */}
        </Splitter>
      </React.Fragment>
    );
  }
}
