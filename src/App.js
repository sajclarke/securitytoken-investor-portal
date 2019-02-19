import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';



import { Card, Button } from 'antd';


import PolymathRegistry from './contracts/PolymathRegistry.json';
import GeneralTransferManager from './contracts/GeneralTransferManager.json';
import SecurityToken from './contracts/SecurityToken.json';
import SecurityTokenRegistry from './contracts/SecurityTokenRegistry.json';
import CappedSTO from './contracts/CappedSTO.json';

import InvestorTable from './components/InvestorTable'
import WhitelistTable from './components/WhitelistTable'

import { getDetails, getWhiteList, getInvestors } from './utils'

import Web3 from 'web3';

class App extends Component {

  constructor() {
    super()
    this.state = {
      tickerSymbol: window.location.pathname.replace('/', ''),
      owner: '',
      STOAddress: '',
      tokenDetails: null,
    }
  }


  componentWillMount = async () => {

    const web3 = new Web3(Web3.givenProvider)

    const accounts = await web3.eth.getAccounts()

    const polyRegInstance = new web3.eth.Contract(PolymathRegistry.abi, '0x5b215a7d39ee305ad28da29bf2f0425c6c2a00b3')
    const st20Address = await polyRegInstance.methods.getAddress("SecurityTokenRegistry").call()

    const st20Registry = new web3.eth.Contract(SecurityTokenRegistry.abi, st20Address)
    const st20Token = await st20Registry.methods.getSecurityTokenAddress(this.state.tickerSymbol).call()


    const securityToken = new web3.eth.Contract(SecurityToken.abi, st20Token)
    const tokenOwner = await securityToken.methods.owner().call()

    const stoAddress = await securityToken.methods.getModulesByName(Web3.utils.fromAscii("CappedSTO")).call()


    const GTMKEY = 2
    const STOKEY = 3

    let gtmModules = await securityToken.methods.getModulesByType(GTMKEY).call(); //CappedSTO
    const GTManager = new web3.eth.Contract(GeneralTransferManager.abi, gtmModules[0])

    //Get whitelisted investors
    const whiteListData = await getWhiteList(GTManager)


    let STOAddress = stoAddress[0]
    const currentSTO = new web3.eth.Contract(CappedSTO.abi, STOAddress);

    //Get list of investors who purchased tokens
    const investorList = await getInvestors(currentSTO)


    //Get STO Details
    const details = await currentSTO.methods.getSTODetails().call({ from: accounts[0] })
    if (details) {
      const stoDetails = getDetails(stoAddress, details)
      this.setState({ stoDetails })
    }


    this.setState({ account: accounts[0], web3: web3, owner: tokenOwner, stoAddress: stoAddress[0], whitelist: whiteListData, currentSTO, investorList: investorList })

  }

  handleInvest = async () => {

    const { account, currentSTO, web3 } = this.state

    await currentSTO.methods.buyTokens(account).send({ value: web3.utils.toWei("1"), from: account, gasLimit: 210000 })
      .then(function (result) {
        // console.log('gas amount', gasAmount)
        console.log(result)
      })
      .catch(function (error) {
        console.error(error)
      });

  }



  render() {

    const { tickerSymbol, owner, stoDetails, whitelist, investorList } = this.state

    return (
      <div>

        <Card title="Security Token Offering">
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

          <Card
            type="inner"
            title="WhiteList"
          >
            <WhitelistTable data={whitelist} />
          </Card>
          <Card
            style={{ marginTop: 16 }}
            type="inner"
            title="Investors"
          >
            <InvestorTable data={investorList} />
          </Card>
        </Card>


      </div>
    );
  }
}

export default App;
