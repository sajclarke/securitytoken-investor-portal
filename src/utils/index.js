import BigNumber from 'bignumber.js'
import Web3 from 'web3'

const _toDate = (v) => {
    return new Date(v * 1000);
}

const _fromWei = (v) => {
    return new BigNumber(Web3.utils.fromWei(v, "ether"));
}

const dateFormat = (date) =>
    date.toLocaleDateString('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });

export const getDetails = (stoAddress, data) => {

    return {
        address: stoAddress,
        start: dateFormat(_toDate(data[0])),
        end: dateFormat(_toDate(data[1])),
        cap: _fromWei(data[2]),
        raised: _fromWei(data[3]),
        tokensSold: data[4],
        fundsRaised: data[5],
        investorCount: data[6],
        isPolyFundraise: data[7],
        type: 'CappedSTO',
    };
}

export const getWhiteList = async (GTManager) => {
    const events = await GTManager.getPastEvents(
        'ModifyWhitelist',
        {
            filter: true ? { _canBuyFromSTO: false } : {},
            fromBlock: 0,
            toBlock: 'latest',
        }
    );


    const logs = []
    for (let event of events) {
        logs.push({
            address: event.returnValues._investor,
            addedBy: event.returnValues._addedBy,
            added: _toDate(event.returnValues._dateAdded),
            from: _toDate(event.returnValues._fromTime),
            to: _toDate(event.returnValues._toTime),
            expiry: _toDate(event.returnValues._expiryTime),
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

    return removeZeroTimestampArray;
}


export const getInvestors = async (currentSTO) => {

    let purchaseEvents = await currentSTO.getPastEvents('TokenPurchase', {
        fromBlock: 0,
        toBlock: 'latest',
    })

    const investorList = [];
    for (let event of purchaseEvents) {
        // noinspection JSUnresolvedVariable
        investorList.push({
            investor: event.returnValues.beneficiary,
            txHash: event.transactionHash,
            amount: event.returnValues.amount,
            paid: event.returnValues.value,
        });
    }
    return investorList

}


