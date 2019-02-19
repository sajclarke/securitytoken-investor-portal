import React from 'react'
import moment from 'moment'
import { Table } from 'antd'

import Web3 from 'web3'
const web3 = new Web3()

const columns = [{
    title: 'Added',
    dataIndex: 'added',
    key: 'added',
    render: added => (
        moment(added).format('DD MMM, YYYY') !== 'Invalid date' ? moment(added).format('DD MMM, YYYY') : ''
    ),
}, {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
    render: address => (
        <a href={`https://kovan.etherscan.io/address/${address}`} > {address.substr(0, 6)}...</a>
    )
}, {
    title: 'KYC Expiry',
    dataIndex: 'expiry',
    key: 'expiry',
    render: expiry => (
        moment(expiry).format('DD MMM, YYYY') !== 'Invalid date' ? moment(expiry).format('DD MMM, YYYY') : ''
    ),
}, {
    title: 'Can Buy From STO',
    dataIndex: 'canBuyFromSTO',
    key: 'canBuyFromSTO',
    render: canBuyFromSTO => (
        canBuyFromSTO ? 'TRUE' : ''
    ),
}];

const WhitelistTable = ({ data }) =>
    <Table dataSource={data} columns={columns} />

export default WhitelistTable