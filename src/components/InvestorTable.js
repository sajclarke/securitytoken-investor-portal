import React from 'react'

import { Table } from 'antd'

import Web3 from 'web3'

const web3 = new Web3()

const columns = [{
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: amount => (
        web3.utils.fromWei(amount, "ether")
    ),
}, {
    title: 'Investor',
    dataIndex: 'investor',
    key: 'investor',
    render: investor => (
        <a href={`https://kovan.etherscan.io/address/${investor}`} > {investor.substr(0, 6)}...</a>
    )
}, {
    title: 'Paid',
    dataIndex: 'paid',
    key: 'paid',
    render: paid => (
        web3.utils.fromWei(paid, "ether")
    ),
}, {
    title: 'Tx Hash',
    dataIndex: 'txHash',
    key: 'txHash',
    render: txHash => (
        <a href={`https://kovan.etherscan.io/address/${txHash}`} > {txHash.substr(0, 6)}...</a>
    )
}];


const InvestorTable = ({ data }) =>
    <Table dataSource={data} columns={columns} />

export default InvestorTable