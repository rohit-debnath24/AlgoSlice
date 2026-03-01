"use client";

import React, { ReactNode } from "react";
import { WalletProvider as TxnlabWalletProvider, NetworkId } from "@txnlab/use-wallet-react";
import { WalletManager } from "@txnlab/use-wallet";

// Initialize the WalletManager with the required configuration for Lute
const walletManager = new WalletManager({
    wallets: [
        {
            id: "lute",
            options: { siteName: "GPUX Dashboard" },
        },
    ],
    network: NetworkId.TESTNET,
});

export function WalletProvider({ children }: { children: ReactNode }) {
    return (
        <TxnlabWalletProvider manager={walletManager}>
            {children}
        </TxnlabWalletProvider>
    );
}
