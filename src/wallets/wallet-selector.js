import { create as createStore } from 'zustand';
import { distinctUntilChanged, map } from 'rxjs';
import { providers } from 'near-api-js';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";

import { useEffect, useState } from 'react';

import { randomBytes } from 'crypto';

export const useWallet = createStore(set => ({
  signedAccountId: '',
  logOut: undefined,
  logIn: undefined,
  selector: undefined,
  viewMethod: undefined,
  callMethod: undefined,
  signMessage: undefined,
  setLogActions: ({ logOut, logIn }) => set({ logOut, logIn }),
  setAuth: ({ signedAccountId }) => set({ signedAccountId }),
  setMethods: ({ viewMethod, callMethod, signMessage }) => set({ viewMethod, callMethod, signMessage}),
  setStoreSelector: ({ selector }) => set({ selector }),
  // setSignMessage: ({signMessage}) => set({signMessage})
}));

export function useInitWallet({ createAccessKeyFor, networkId }) {
  const setAuth = useWallet(store => store.setAuth);
  const setLogActions = useWallet(store => store.setLogActions);
  const setMethods = useWallet(store => store.setMethods);
  const setStoreSelector = useWallet(store => store.setStoreSelector);
  const [selector, setSelector] = useState(undefined);

  useEffect(() => {
    const selector = setupWalletSelector({
      network: networkId,
      modules: [setupMyNearWallet(), setupHereWallet(),setupMeteorWallet()]
    });

    setSelector(selector);
    setStoreSelector({ selector });
  }, [networkId, setStoreSelector]);

  useEffect(() => {
    if (!selector) return;

    selector.then(walletSelector => {
      const accounts = walletSelector.store.getState().accounts;
      const signedAccountId = accounts.find((account) => account.active)?.accountId || '';
      setAuth({ signedAccountId });

      walletSelector.store.observable
        .pipe(
          map((state) => state.accounts),
          distinctUntilChanged()
        )
        .subscribe((accounts) => {
          const signedAccountId = accounts.find((account) => account.active)?.accountId || '';
          setAuth({ signedAccountId });
        });
    });
  }, [selector, setAuth]);

  useEffect(() => {
    if (!selector) return;
    // defined logOut and logIn actions
    const logOut = async () => {
      const wallet = await (await selector).wallet();
      await wallet.signOut();
      setAuth({ signedAccountId: '' });
    };

    const logIn = async () => {
      const modal = setupModal(await selector, { contractId: createAccessKeyFor });
      modal.show();
    };

    setLogActions({ logOut, logIn });
  }, [createAccessKeyFor, selector, setAuth, setLogActions]);

  useEffect(() => {
    if (!selector) return;

    const viewMethod = async (contractId, method, args = {}) => {
      const { network } = (await selector).options;
      const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

      let res = await provider.query({
        request_type: 'call_function',
        account_id: contractId,
        method_name: method,
        args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
        finality: 'optimistic',
      });
      return JSON.parse(Buffer.from(res.result).toString());
    };

    const signMessage = async () => {
      const challenge = randomBytes(32)
      console.log('challenge:', challenge)
      const message = 'Login with NEAR'
      const recipient = "dinhthanh.testnet"
      const wallet = await (await selector).wallet();
      const signature = await wallet.signMessage({ message, recipient, nonce: challenge, callbackUrl: "" })
      console.log('signature:', signature)
    }

    const callMethod = async (contractId, method, args = {}, gas = '30000000000000', deposit = 0) => {
      const wallet = await (await selector).wallet();

      const outcome = await wallet.signAndSendTransaction({
        receiverId: contractId,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: method,
              args,
              gas,
              deposit,
            },
          },
        ],
      });

      return providers.getTransactionLastResult(outcome);
    };

    setMethods({ viewMethod, callMethod , signMessage});

  }, [selector, setMethods]);
}