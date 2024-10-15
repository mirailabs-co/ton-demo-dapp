import { SendTransactionRequest } from '@tonconnect/sdk';
import { Button, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import ReactJson from 'react-json-view';
import { useRecoilValueLoadable } from 'recoil';
import { sendTransaction } from 'src/connector';
import { useSlicedAddress } from 'src/hooks/useSlicedAddress';
import { useTonWallet } from 'src/hooks/useTonWallet';
import { generatePayload } from 'src/nft-transaction';
import { walletsListQuery } from 'src/state/wallets-list';
import { Address } from 'ton';
import './style.scss';

const { Title } = Typography;

export function TxForm() {
	const [tx, setTx] = useState<SendTransactionRequest | null>(null);
	const [sendTo, setSendTo] = useState<string>('');
	const [addressError, setAddressError] = useState<boolean>(false);
	const wallet = useTonWallet();
	const walletsList = useRecoilValueLoadable(walletsListQuery);

	const removeTxMessage = useCallback(() => {
		if (tx && tx.messages.length === 2) {
			setTx(
				(value) =>
					({
						...value,
						messages: value!.messages.slice(1),
					} as SendTransactionRequest),
			);
		}
	}, [tx]);

	useEffect(() => {
		if (wallet) {
			const tx = {
				validUntil: Date.now() + 1000000,
				messages: [
					{
						address: Address.parseRaw(wallet?.account.address).toFriendly({
							bounceable: false,
						}),
						amount: '100000000',
					},
				],
			};

			setTx(tx);
		} else {
			setTx(null);
			setSendTo('');
		}
	}, [wallet]);

	useEffect(() => {
		if (sendTo) {
			let isCorrect;
			try {
				Address.parseFriendly(sendTo);
				isCorrect = true;
			} catch (e) {
				isCorrect = false;
			}

			if (!isCorrect) {
				setAddressError(true);
				removeTxMessage();
				return;
			}

			setAddressError(false);
			const payload = generatePayload(sendTo);

			setTx(
				(value) =>
					({
						...value,
						messages: [...value!.messages].concat({
							address: value!.messages[0].address,
							amount: '50000000',
							payload,
						}),
					} as SendTransactionRequest),
			);
		} else {
			setAddressError(false);
			removeTxMessage();
		}
	}, [sendTo]);

	const onChange = useCallback(
		(value: object) => setTx((value as { updated_src: SendTransactionRequest }).updated_src),
		[],
	);

	return (
		<div className="send-tx-form">
			<React.Fragment />
			<Title level={3}>Configure and try to send TON</Title>

			{wallet && tx ? (
				<>
					<div className="send-tx-wrapper">
						<ReactJson src={tx} theme="ocean" onEdit={onChange} onAdd={onChange} onDelete={onChange} />
						<Button
							type="primary"
							shape="round"
							disabled={addressError}
							onClick={() => sendTransaction(tx, walletsList.contents.walletsList[0])}
						>
							Send transaction
						</Button>
					</div>
				</>
			) : (
				<div className="send-tx-form__error">Connect wallet to send the transaction</div>
			)}
		</div>
	);
}
