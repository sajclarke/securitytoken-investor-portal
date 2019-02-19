import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import BigNumber from 'bignumber.js';

import moment from 'moment'

import { Table, Card, Icon, Avatar, Button } from 'antd';

// import STOStatus from '@polymathnetwork/ui'

//copied from @polymathnetwork/polymath-scripts/fixtures/contracts/SecurityToken.json
import PolymathRegistry from './contracts/PolymathRegistry.json';
import PolyTokenFaucet from './contracts/PolyTokenFaucet.json';
import GeneralTransferManager from './contracts/GeneralTransferManager.json';
import SecurityToken from './contracts/SecurityToken.json';
import SecurityTokenRegistry from './contracts/SecurityTokenRegistry.json';
import CappedSTO from './contracts/CappedSTO.json';
import USDTieredSTO from './contracts/USDTieredSTO.json';


import Web3 from 'web3';

class App extends Component {

  constructor() {
    super()
    this.state = {
      tickerSymbol: 'BARB-02',
      // tickerSymbol:'SAJC-L1A',
      owner: '',
      STOAddress: '',
      tokenDetails: null,
    }
  }

  _toDate(v) {
    return new Date(v * 1000);
  }

  _fromWei(v) {
    return new BigNumber(Web3.utils.fromWei(v, "ether"));
  }

  dateFormat = (date) =>
    date.toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });

  componentWillMount = async () => {

    const web3 = new Web3(Web3.givenProvider)

    const accounts = await web3.eth.getAccounts()

    //SecurityTokenRegistry: 0xB529f14AA8096f943177c09Ca294Ad66d2E08b1f
    // PolyToken: 0x8cdaf0cd259887258bc13a92c0a6da92698644c0
    //STOFactory?: 0xcB7c9bf62cb0F778262210fa1B68dA61c9D6CCD7
    //?0xcEe94E5D4c424E229af969Aa1c1fD0e1a9DE9ADB
    //CappedSTO? 0x5dE9C2eDe0d681132be382FDF3535FE04eA2a575 for A0T0
    //USDSTO? 0xC21012955092E09158648A36C3010Bf70130CCC4 for A0T1
    //TransferManager: 0x212Ad5fCC5AB44DB2d7Cf524382E7A7b0F15252b

    //Polymath Registry (Kovan) 0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3 (from  https://github.com/PolymathNetwork/polymath-core/blob/c5fe85058adebc12c62a57c524d4e5636d51eed8/CLI/commands/helpers/contract_addresses.js)

    //Betastudio Kovan PolymathRegistry? 0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3
    //Betastudio Kovan STRegistry? 0x91110C2f67e2881a8540417BE9eaDF5bC9f2F248
    // 

    // const polyRegInstance = new web3.eth.Contract(PolymathRegistry.abi, '0x9903e7b5acfe5fa9713771a8d861eb1df8cd7046')
    const polyRegInstance = new web3.eth.Contract(PolymathRegistry.abi, '0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3')
    console.log(polyRegInstance)

    const st20Address = await polyRegInstance.methods.getAddress("SecurityTokenRegistry").call()
    console.log(st20Address)

    const st20Registry = new web3.eth.Contract(SecurityTokenRegistry.abi, st20Address)
    console.log(st20Registry)

    const st20Token = await st20Registry.methods.getSecurityTokenAddress(this.state.tickerSymbol).call()
    console.log(st20Token)

    // const tickerRegInstance = new web3.eth.Contract(SecurityTokenRegistry.abi, '0xB529f14AA8096f943177c09Ca294Ad66d2E08b1f')
    // console.log(tickerRegInstance)

    // const tickerInfo = await tickerRegInstance.methods.getTickerDetails('A0T0').call()
    // // const tickerInfo = await tickerRegInstance.methods.getTickersByOwner(accounts[0]).call({from:accounts[0]})
    // console.log(tickerInfo)

    // const tokenInfo = await tickerRegInstance.methods.getSecurityTokenAddress('A0T0').call()
    // console.log(tokenInfo)


    const securityToken = new web3.eth.Contract(SecurityToken.abi, st20Token)
    console.log(securityToken)

    const tokenOwner = await securityToken.methods.owner().call()
    console.log(tokenOwner)

    this.setState({ owner: tokenOwner })

    const stoAddress = await securityToken.methods.getModulesByName(Web3.utils.fromAscii("CappedSTO")).call()
    console.log(stoAddress)

    this.setState({ stoAddress: stoAddress[0] })

    const GTMKEY = 2
    const STOKEY = 3

    let gtmModules = await securityToken.methods.getModulesByType(GTMKEY).call(); //CappedSTO
    console.log(gtmModules[0])

    const GTManager = new web3.eth.Contract(GeneralTransferManager.abi, gtmModules[0])
    console.log(GTManager)

    const events = await GTManager.getPastEvents(
      'ModifyWhitelist',
      {
        filter: true ? { _canBuyFromSTO: false } : {},
        fromBlock: 0,
        toBlock: 'latest',
      }
    );
    console.log(events)

    const logs = []
    for (let event of events) {
      logs.push({
        address: event.returnValues._investor,
        addedBy: event.returnValues._addedBy,
        added: this._toDate(event.returnValues._dateAdded),
        from: this._toDate(event.returnValues._fromTime),
        to: this._toDate(event.returnValues._toTime),
        expiry: this._toDate(event.returnValues._expiryTime),
        canBuyFromSTO: event.returnValues._canBuyFromSTO,
      });
    }

    const investors = [];
    for (let i = 0; i < logs.length; i++) {
      const found = investors.some((el, index, array) => {
        if (el.address === logs[i].address) {
          // $FlowFixMe
          if (logs[i].added > el.added) {
            array[index] = logs[i];
            return true;
          }
          return true;
        }
        return false;
      });
      if (!found) {
        investors.push(logs[i]);
      }
    }
    const removeZeroTimestampArray = [];
    for (let j = 0; j < investors.length; j++) {
      // $FlowFixMe
      if (
        investors[j].from.getTime() !== 0 &&
        investors[j].to.getTime() !== 0
      ) {
        removeZeroTimestampArray.push(investors[j]);
      }
    }

    console.log(removeZeroTimestampArray)
    this.setState({ whitelist: removeZeroTimestampArray })

    let STOAddress = stoAddress[0]

    const currentSTO = new web3.eth.Contract(CappedSTO.abi, STOAddress);
    console.log(currentSTO)
    console.log(accounts[0])

    this.setState({ currentSTO })






    const purchaseEvents = await currentSTO.getPastEvents('TokenPurchase', {
      fromBlock: 0,
      toBlock: 'latest',
    }).then((results) => {
      // console.log(results)
      const investorList = [];
      for (let event of results) {
        // noinspection JSUnresolvedVariable
        investorList.push({
          investor: event.returnValues.beneficiary,
          txHash: event.transactionHash,
          amount: event.returnValues.amount,
          paid: event.returnValues.value,
        });
      }
      // console.log(investorList);
      this.setState({ investorList })
    });

    // console.log(purchaseEvents)
    // const isPolyFundraise = await this.isPolyFundraise();
    // for (let event of purchaseEvents) {
    //   // noinspection JSUnresolvedVariable
    //   result.push({
    //     investor: event.returnValues.beneficiary,
    //     txHash: event.transactionHash,
    //     amount: await this.token.removeDecimals(event.returnValues.amount),
    //     paid: event.returnValues.value,
    //   });
    // }
    // console.log(result);

    //Instantiate the smart contract
    //Q: How to find out the addresses of deployed contracts???
    //A: Found them by looking at metamask addresses per transactions
    // const contractInstance = new web3.eth.Contract(SecurityTokenRegistry.abi, '0xB529f14AA8096f943177c09Ca294Ad66d2E08b1f')
    // const contractInstance = new web3.eth.Contract(PolyTokenFaucet.abi, '0x8cdaf0cd259887258bc13a92c0a6da92698644c0')
    // console.log(contractInstance)



    //   const stoAddress = '0x5dE9C2eDe0d681132be382FDF3535FE04eA2a575'
    //   const usdSTOAddress = '0xC21012955092E09158648A36C3010Bf70130CCC4'

    //   const usdstoInstance = new web3.eth.Contract(USDTieredSTO.abi, )
    // // const stoInstance = new web3.eth.Contract(CappedSTO.abi, '0xc9af1d88fe48c8a6aa8677a29a89b0a6ae78f5a8')
    //   console.log(usdstoInstance)

    // const stoInstance = new web3.eth.Contract(CappedSTO.abi, )
    // // const stoInstance = new web3.eth.Contract(CappedSTO.abi, '0xc9af1d88fe48c8a6aa8677a29a89b0a6ae78f5a8')
    //   console.log(stoInstance)

    // const balance = await contractInstance.methods.balanceOf(accounts[0]).call()
    // console.log(balance)

    const details = await currentSTO.methods.getSTODetails().call({ from: accounts[0] })
    console.log(details)
    // startTime,
    // endTime,
    // cap,
    // rate,
    // fundsRaised,
    // investorCount,
    // tokensSold,
    // isPolyFundraise,

    if (details) {
      const stoDetails = this.getDetails(stoAddress, details)
      console.log(stoDetails)
      this.setState({ stoDetails })
    }



    console.log(this.dateFormat(this._toDate(details[0])))
    console.log(this.dateFormat(this._toDate(details[1])))

    // // console.log(moment(parseInt(details[1])).format('YYYY-MM-DD HH:mm'))
    // // console.log(moment(details[1]).format('YYYY-MM-DD HH:mm'))

    // await web3.eth.sendTransaction({
    //     from: accounts[0],
    //     to: '0x4d11070B69E6c2734cF99bcD1A644ef6D7752b5f',
    //     gas: 2100000,
    //     value: web3.utils.toWei("5", "ether")
    // }).on('transactionHash', function(hash){
    //     console.log('transactionHash', hash)
    // })
    // .on('receipt', function(receipt){
    //     console.log('receipt', receipt)
    // })
    // .on('confirmation', function(confirmationNumber, receipt){ 
    //   console.log('confirmation', confirmationNumber, receipt)
    // })
    // .on('error', console.error); // If a out of gas error, the second parameter is the receipt.;


    // const tokensSold = await stoInstance.methods.getTokensSold().call()
    // console.log(tokensSold)

    // const getOwners = await contractInstance.methods.getCustomers().call();
    // const ownerAddress = await contractInstance.methods.getOwner(0).call();
    // console.log(getOwners,ownerAddress)

    // console.log(accounts, contractInstance)

    this.setState({ account: accounts[0], web3: web3 })

  }

  handleInvest = async () => {

    const { account, stoDetails, currentSTO, web3 } = this.state

    console.log(stoDetails.address)

    // await web3.eth.sendTransaction({
    //       from: account,
    //       to: stoDetails.address[0],
    //       gas: 2100000,
    //       value: web3.utils.toWei("1", "ether")
    //   }).on('transactionHash', function(hash){
    //       console.log('transactionHash', hash)
    //   })
    //   .on('receipt', function(receipt){
    //       console.log('receipt', receipt)
    //   })
    //   .on('confirmation', function(confirmationNumber, receipt){ 
    //     console.log('confirmation', confirmationNumber, receipt)
    //   })
    //   .on('error', console.error); // If a out of gas error, the second parameter is the receipt.;

    await currentSTO.methods.buyTokens(account).send({ value: web3.utils.toWei("1"), from: account, gasLimit: 210000 })
      .then(function (result) {
        // console.log('gas amount', gasAmount)
        console.log(result)
      })
      .catch(function (error) {
        console.error(error)
      });

  }

  getDetails = (stoAddress, data) => {

    // console.log(data)
    // const [
    //   startTime,
    //   endTime,
    //   cap,
    //   rate,
    //   fundsRaised,
    //   investorCount,
    //   tokensSold,
    //   isPolyFundraise,
    // ] = data;

    return {
      address: stoAddress,
      start: this.dateFormat(this._toDate(data[0])),
      end: this.dateFormat(this._toDate(data[1])),
      cap: this._fromWei(data[2]),
      raised: this._fromWei(data[3]),
      tokensSold: data[4],
      fundsRaised: data[5],
      investorCount: data[6],
      isPolyFundraise: data[7],
      type: 'CappedSTO',
    };
  }

  render() {

    const { tickerSymbol, owner, stoAddress, currentSTO, stoDetails, whitelist, investorList } = this.state
    console.log(stoDetails)

    // let stoDetails = null


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

    const web3 = new Web3(Web3.givenProvider)

    const columns_2 = [{
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

    const gridStyle = {
      width: '50%',
      textAlign: 'left',
      // display: 'flex',
      flex: '1 0 auto',
    };

    return (
      <div>

        <Card title="STO Fundraise">
          {/*  */}
          <Card type="inner">
            <div className="flex">
              <div className="col">



                <h4>Ticker details</h4>
                <p>Token name:<br />{tickerSymbol}</p>
                <p>Owner:<br />{owner}</p>

                <Button className="btn" type="secondary" size="large">Learn more</Button>

              </div>
              <div className="col">


                <h4>STO Details</h4>
                {stoDetails && (
                  <div>
                    <p>Address: {stoDetails.address}</p>
                    <p>
                      Start Date: {stoDetails.start}<br />
                      End Date: {stoDetails.end}<br />
                      Cap: {stoDetails.cap.toNumber()}<br />
                      Raised: {stoDetails.raised.toNumber()}<br />
                      Tokens Sold: {stoDetails.tokensSold}<br />
                      Funds Raised: {stoDetails.fundsRaised}<br />
                      Investor Count: {stoDetails.investorCount}<br />
                      POLY Fund raise?: {stoDetails.isPolyFundraise}
                    </p>
                  </div>
                )}

                <Button className="btn" type="primary" size="large" onClick={this.handleInvest}>Invest Now</Button>

              </div>



            </div>

          </Card>
          <p
            style={{
              fontSize: 14,
              color: 'rgba(0, 0, 0, 0.85)',
              marginBottom: 16,
              fontWeight: 500,
            }}
          >

          </p>
          <Card
            type="inner"
            title="WhiteList"

          >
            <Table dataSource={whitelist} columns={columns} />
          </Card>
          <Card
            style={{ marginTop: 16 }}
            type="inner"
            title="Investors"

          >
            <Table dataSource={investorList} columns={columns_2} />
          </Card>
        </Card>


      </div >
    );
  }
}

export default App;
