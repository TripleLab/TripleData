import React from 'react';
import { Flex, FlexProps } from 'reflexy';
import { Dropdown, Menu, Select } from 'antd';
import { SelectValue } from 'antd/lib/select';
import { ServerStructure } from 'services';
import { Statistics } from 'services/api/DataDecorator';
import { MenuInfo } from 'rc-menu/lib/interface';
import ActionButton, { Props as ActionButtonProps } from './ActionButton';
import RequestStats from '../../RequestStats';
import css from './Toolbar.css';
import { CaretRightOutlined, ForwardOutlined, SaveOutlined } from '@ant-design/icons';
import format_logo from '../../../../../assets/images/format.png';
import save_logo from '../../../../../assets/images/save.png';
import add_logo from '../../../../../assets/images/add.png';
import enter_logo from '../../../../../assets/images/enter.png';
import load_logo from '../../../../../assets/images/load.png';
import mac_logo from '../../../../../assets/images/mac.png';

export enum ActionType {
  Save = 1,
  RunCurrent = 2,
  RunAll = 3,
  Fullscreen = 4,
}

export interface ToolbarProps extends Pick<ActionButtonProps<ActionType>, 'onAction'> {
  databases: ReadonlyArray<ServerStructure.Database>;
  currentDatabase: string;
  onDatabaseChange?: (db: ServerStructure.Database) => void;
  stats?: Statistics;
  formatCode?: any;
  saveCallback?: any;
  store?: any;
  content2?: any;
}

function SpaceH() {
  return <div className={css['space-h']} />;
}

export default class Toolbar extends React.Component<ToolbarProps & FlexProps> {
  private onDatabaseChange = (value: SelectValue) => {
    const { onDatabaseChange } = this.props;
    if (!onDatabaseChange) return;

    const { databases } = this.props;
    const db = databases.find((_) => _.name === value?.toString());
    db && onDatabaseChange(db);
  };

  render() {
    const {
      databases,
      currentDatabase,
      onDatabaseChange,
      onAction,
      stats,
      formatCode,
      saveCallback,
      content2,
      store,
      ...rest
    } = this.props;

    // const { tabsStore:any } = this.props;
    // const { uiStore } = tabsStore;

    const onActionMenuClick = (click: MenuInfo) => {
      onAction(parseInt(click.key, 0), click.domEvent);
    };
    const onActionRunRunCurrent = (event: React.MouseEvent<HTMLElement>) => {
      onAction(ActionType.RunCurrent, event);
    };

    const menu = (
      <Menu onClick={onActionMenuClick}>
        <Menu.Item key={ActionType.RunCurrent}>
          <CaretRightOutlined style={{ color: 'green' }} />
          Run current ⌘ + ⏎
        </Menu.Item>

        <Menu.Item key={ActionType.RunAll}>
          <ForwardOutlined style={{ color: 'green' }} />
          Run all ⇧ + ⌘ + ⏎
        </Menu.Item>
      </Menu>
    );

    return (
      <Flex alignItems="center" justifyContent="flex-end" style={{ background: 'rgb(30,30,30)' }}>
        <div
          className={css['button']}
          id="hoverButton"
          onClick={formatCode}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <img
            src={format_logo}
            alt=""
            style={{ marginRight: '10px', height: '10px', marginTop: '2px' }}
          />
          Format
        </div>

        <div
          className={css['button']}
          id="hoverButton"
          onClick={saveCallback}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <img src={save_logo} alt="" style={{ marginRight: '10px', height: '13px' }} />
          Save
        </div>

        <div
          className={css['button']}
          id="hoverButton"
          onClick={onActionRunRunCurrent}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: !!store.uiStore.executingQueries.length ? '#5B616F' : '#34373C',
          }}
        >
          {!!store.uiStore.executingQueries.length ? (
            <img src={load_logo} alt="" style={{ marginRight: '10px', height: '13px' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={mac_logo} alt="" style={{ marginRight: '5px', height: '13px' }} />
              <img src={add_logo} alt="" style={{ marginRight: '5px', height: '9px' }} />
              <img src={enter_logo} alt="" style={{ marginRight: '10px', height: '13px' }} />
            </div>
          )}
          {/* {!!store.uiStore.executingQueries.length && (
 
          )} */}
          Run
        </div>
        <div style={{ height: '9px' }}></div>

        {/* <Flex grow justifyContent="flex-end">
          {stats && (
            <>
              <SpaceH />
              <RequestStats {...stats} />
            </>
          )}

          <SpaceH />
        </Flex> */}
      </Flex>
    );
  }
}
