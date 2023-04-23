import React from 'react';
import { IReactionDisposer, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { Redirect, RouteComponentProps, Switch, withRouter } from 'react-router';
import { AuthorizationProvider, LoggedInRoute, NotLoggedInRoute } from 'module/react-auth';
import { typedInject } from 'module/mobx-utils';

import 'assets/styles/global.css';
import { AppStore, Stores } from 'stores';
import { routePaths } from 'routes';
import { Connection } from 'services';
import AppErrorBoundary from 'components/AppErrorBoundary';
import DashboardView from 'views/DashboardView';
import SignInView from 'views/SignInView';
import SignOut from 'components/SignOut';

export interface InjectedProps {
  store: AppStore;
}

export interface Props extends InjectedProps {
  connection?: Connection;
}

type RoutedProps = Props & RouteComponentProps<any>;

@observer
class App extends React.Component<RoutedProps> {
  private static toggleAppLoader(loading: boolean) {
    const appRootElement = document.getElementById('root')!;
    appRootElement.classList.toggle('loading', loading);
  }

  protected loadingReaction?: IReactionDisposer;

  GetQueryString = (name: any) => {
    console.log('window.location.search: ', window.location.search);

    var reg: any = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r: any = window.location.search.substr(1).match(reg); //获取url中"?"符后的字符串并正则匹配
    var context = '';
    if (r != null) context = decodeURIComponent(r[2]);
    reg = null;
    r = null;
    return context == null || context == '' || context == 'undefined' ? '' : context;
  };

  componentDidMount() {
    console.log('App->componentDidMount');
    console.log('window.location.search: ', window.location.search);

    const { store, connection } = this.props;

    if(this.GetQueryString('code')){
      console.log('th', this.GetQueryString('code'));
      localStorage.setItem('code', this.GetQueryString('code'));
    }

    this.loadingReaction = reaction(
      () => store.uiStore.loading,
      (loading) => App.toggleAppLoader(loading)
    );

    connection && store.initApi(connection);
  }

  componentWillUnmount() {
    this.loadingReaction && this.loadingReaction();
    const { store } = this.props;
    store.disposeStores();
  }

  render() {
    const { store } = this.props;

    if (store.uiStore.loading) {
      // Show loader in html until app data will be loaded.
      return null;
    }

    const error = store.uiStore.hasError ? store.uiStore.notifications[0].text : '';
    return (
      <AppErrorBoundary error={error}>
        <AuthorizationProvider
          isLoggedIn={store.isLogIn}
          isAuthorized={store.isAuthorized}
          redirectTo={routePaths.signIn.path}
          notLoggedInRedirectTo={routePaths.home.path}
        >
          <Switch>
            <NotLoggedInRoute exact path={routePaths.signIn.path} component={SignInView} />

            <LoggedInRoute exact path={routePaths.signOut.path} component={SignOut} />

            <LoggedInRoute exact path={routePaths.dashboard.path} component={DashboardView} />

            <LoggedInRoute exact path={routePaths.home.path}>
              <Redirect to={routePaths.dashboard.path} />
            </LoggedInRoute>

            <Redirect to={routePaths.home.path} />
          </Switch>
        </AuthorizationProvider>
      </AppErrorBoundary>
    );
  }
}

// Need `withRouter` to work router with mobx `observer`.
export default withRouter(
  typedInject<InjectedProps, RoutedProps, Stores>(({ store }) => ({ store: store.appStore }))(App)
);
