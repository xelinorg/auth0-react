import React, { ComponentType, useEffect, FC } from 'react';
import {
  PopupConfigOptions,
  PopupLoginOptions,
  RedirectLoginOptions,
} from '@auth0/auth0-spa-js';
import useAuth0 from './use-auth0';

/**
 * @ignore
 */
const defaultOnRedirecting = (): JSX.Element => <></>;

/**
 * @ignore
 */
const defaultReturnTo = (): string =>
  `${window.location.pathname}${window.location.search}`;

/**
 * Options for the withAuthenticationRequired Higher Order Component
 */
export interface WithAuthenticationRequiredOptions {
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   returnTo: '/profile'
   * })
   * ```
   *
   * or
   *
   * ```js
   * withAuthenticationRequired(Profile, {
   *   returnTo: () => window.location.hash.substr(1)
   * })
   * ```
   *
   * Add a path for the `onRedirectCallback` handler to return the user to after login.
   */
  returnTo?: string | (() => string);
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   onRedirecting: () => <div>Redirecting you to the login...</div>
   * })
   * ```
   *
   * Render a message to show that the user is being redirected to the login.
   */
  onRedirecting?: () => JSX.Element;
  /**
   * ```js
   * withAuthenticationRequired(Profile, {
   *   loginOptions: {
   *     appState: {
   *       customProp: 'foo'
   *     }
   *   }
   * })
   * ```
   *
   * Pass additional login options, like extra `appState` to the login page.
   * This will be merged with the `returnTo` option used by the `onRedirectCallback` handler.
   */
  loginOptions?: RedirectLoginOptions;
}

/**
 * Options for the withAuthenticationRequired Higher Order Component
 */
export interface WithAuthenticationRequiredPopupOptions {
  popup: true;

  loginOptions?: PopupLoginOptions;
  popupOptions?: PopupConfigOptions;
}

const withAuthenticationRedirectRequired = <P extends object>(
  Component: ComponentType<P>,
  options: WithAuthenticationRequiredOptions = {}
): FC<P> => {
  return function WithAuthenticationRequired(props: P): JSX.Element {
    const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
    const {
      returnTo = defaultReturnTo,
      onRedirecting = defaultOnRedirecting,
      loginOptions = {},
    } = options;

    useEffect(() => {
      if (isLoading || isAuthenticated) {
        return;
      }
      const opts = {
        ...loginOptions,
        appState: {
          ...loginOptions.appState,
          returnTo: typeof returnTo === 'function' ? returnTo() : returnTo,
        },
      };
      (async (): Promise<void> => {
        await loginWithRedirect(opts);
      })();
    }, [isLoading, isAuthenticated, loginWithRedirect, loginOptions, returnTo]);

    return isAuthenticated ? <Component {...props} /> : onRedirecting();
  };
};

const withAuthenticationPopupRequired = <P extends object>(
  Component: ComponentType<P>,
  options: WithAuthenticationRequiredPopupOptions = { popup: true }
): FC<P> => {
  return function WithAuthenticationRequired(props: P): JSX.Element {
    const { isAuthenticated, isLoading, loginWithPopup } = useAuth0();

    const { loginOptions = {} } = options;

    useEffect(() => {
      if (isLoading || isAuthenticated) {
        return;
      }
      (async (): Promise<void> => {
        await loginWithPopup(loginOptions, options.popupOptions);
      })();
    }, [isLoading, isAuthenticated, loginWithPopup, loginOptions]);

    return isAuthenticated ? <Component {...props} /> : <></>;
  };
};

/**
 * ```js
 * const MyProtectedComponent = withAuthenticationRequired(MyComponent);
 * ```
 *
 * When you wrap your components in this Higher Order Component and an anonymous user visits your component
 * they will be redirected to the login page and returned to the page they we're redirected from after login.
 */

function withAuthenticationRequired<P extends object>(
  Component: ComponentType<P>
): FC<P>;
function withAuthenticationRequired<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthenticationRequiredOptions
): FC<P>;
function withAuthenticationRequired<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthenticationRequiredPopupOptions
): FC<P>;
function withAuthenticationRequired<P extends object>(
  Component: ComponentType<P>,
  options:
    | WithAuthenticationRequiredOptions
    | WithAuthenticationRequiredPopupOptions = {}
): FC<P> {
  const showPopup = (
    options:
      | WithAuthenticationRequiredOptions
      | WithAuthenticationRequiredPopupOptions
  ): options is WithAuthenticationRequiredPopupOptions => {
    return (options as WithAuthenticationRequiredPopupOptions)['popup'];
  };

  if (showPopup(options)) {
    return withAuthenticationPopupRequired(Component, options);
  } else {
    return withAuthenticationRedirectRequired(Component, options);
  }
}

export default withAuthenticationRequired;
