import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import withAuthenticationRequired from '../src/with-authentication-required';
import { render, screen, waitFor } from '@testing-library/react';
import { Auth0Client } from '@auth0/auth0-spa-js';
import Auth0Provider from '../src/auth0-provider';
import { mocked } from 'ts-jest/utils';

const mockClient = mocked(new Auth0Client({ client_id: '', domain: '' }));

describe('withAuthenticationRequired', () => {
  it('should block access to a private component when not authenticated', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent);
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).toHaveBeenCalled()
    );
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });

  it('should block access to a private component when not authenticated using popup', async () => {
    mockClient.getUser.mockResolvedValue({ name: 'Test' });
    mockClient.getUser.mockResolvedValueOnce(undefined);
    let resolve;
    const promise = new Promise((r) => (resolve = r));
    mockClient.loginWithPopup.mockReturnValue(promise as any);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      popup: true,
    });
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );

    expect(screen.queryByText('Private')).not.toBeInTheDocument();
    (resolve as any)();
    await waitFor(() => expect(mockClient.loginWithPopup).toHaveBeenCalled());
    expect(screen.queryByText('Private')).toBeInTheDocument();
  });

  it('should allow access to a private component when authenticated', async () => {
    mockClient.getUser.mockResolvedValue({ name: '__test_user__' });
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent);
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).not.toHaveBeenCalled()
    );
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should show a custom redirecting message', async () => {
    mockClient.getUser.mockResolvedValue({ name: '__test_user__' });
    const MyComponent = (): JSX.Element => <>Private</>;
    const OnRedirecting = (): JSX.Element => <>Redirecting</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      onRedirecting: OnRedirecting,
    });
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );
    await waitFor(() =>
      expect(screen.getByText('Redirecting')).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).not.toHaveBeenCalled()
    );
    expect(screen.queryByText('Redirecting')).not.toBeInTheDocument();
  });

  it('should pass additional options on to loginWithRedirect', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      loginOptions: {
        fragment: 'foo',
      },
    });
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          fragment: 'foo',
        })
      )
    );
  });

  it('should pass additional options on to loginWithPopup', async () => {
    mockClient.getUser.mockResolvedValue({ name: 'Test' });
    mockClient.getUser.mockResolvedValueOnce(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      popup: true,
      loginOptions: {
        scope: '__test_scope__',
      },
      popupOptions: {
        timeoutInSeconds: 50,
      },
    });
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );
    await waitFor(() =>
      expect(mockClient.loginWithPopup).toHaveBeenCalledWith(
        {
          scope: '__test_scope__',
        },
        {
          timeoutInSeconds: 50,
        }
      )
    );
  });

  it('should merge additional appState with the returnTo', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      loginOptions: {
        appState: {
          foo: 'bar',
        },
      },
      returnTo: '/baz',
    });
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          appState: {
            foo: 'bar',
            returnTo: '/baz',
          },
        })
      )
    );
  });

  it('should accept a returnTo function', async () => {
    mockClient.getUser.mockResolvedValue(undefined);
    const MyComponent = (): JSX.Element => <>Private</>;
    const WrappedComponent = withAuthenticationRequired(MyComponent, {
      returnTo: () => '/foo',
    });
    render(
      <Auth0Provider clientId="__test_client_id__" domain="__test_domain__">
        <WrappedComponent />
      </Auth0Provider>
    );
    await waitFor(() =>
      expect(mockClient.loginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          appState: {
            returnTo: '/foo',
          },
        })
      )
    );
  });
});
