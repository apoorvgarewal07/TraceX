CREATE INDEX wallet_address_index IF NOT EXISTS FOR (w:Wallet) ON (w.address);
CREATE INDEX transfer_tx_index IF NOT EXISTS FOR (t:TRANSFERS_TO) ON (t.tx_hash);
