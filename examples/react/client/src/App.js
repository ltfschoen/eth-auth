import React, { Component } from "react";
import "./App.css";
import Web3 from 'web3'
import sigUtil from 'eth-sig-util'

import getWeb3 from "./getWeb3";

class App extends Component {
  state = { web3: null, accounts: null, challenge: null, signature: null };

  async componentDidMount() {
    const web3 = await getWeb3();
    const accounts = await web3.eth.getAccounts();
    this.setState({ web3, accounts });
    console.log(accounts)
  }

  getChallenge = async () => {
    const { accounts } = this.state;
    const res = await fetch(
      `http://localhost:3001/auth/${accounts[0].toLowerCase()}`
    );
    console.log(res)
    this.setState({ challenge: await res.json() });
  };

  signChallenge = async () => {
    const { web3, challenge, accounts } = this.state;

    const domain = [
      {name:'dApp' , type:'string'},
      {name:'action', type:'string'}
    ]

    const message = [
      {name:'challenge', type:'string'},
    ]

    const domainData = {
      dApp: challenge.domain.dApp,
      action: challenge.domain.action
    }

    const messageData = {
      challenge: challenge.message.challenge,
    }

    const challengeData ={
      types: {
          EIP712Domain: domain,
          Challenge: message
      },
      domain: domainData,
      primaryType: "Challenge",
      message: messageData
    }

    const challengeDataSign =  await JSON.stringify(challengeData)
    console.log(challengeData)
    try{
      web3.currentProvider.sendAsync(
        {
          method: "eth_signTypedData_v3",
          params: [accounts[0], challengeDataSign],
          from: accounts[0]
        },
        (error, res) => {
          if (error) return console.error(error);
          this.setState({ signature: res.result, challenge:challenge.message.challenge });
          const recovered = sigUtil.recoverTypedSignature({
            data: challengeData,
            sig: res.result 
          })

          console.log(recovered)
        }
      );
    }catch(err){
      console.log(err)
    }
    
  };

  verifySignature = async () => {
    const { challenge, signature, accounts } = this.state;
  
    const res = await fetch(
      `http://localhost:3001/auth/${challenge}/${signature}`
    );
    const result = await res.json()
    
    if (res.status === 200 && result.recovered === accounts[0].toLowerCase()) {
      console.log("Signature verified");
    } else {
      console.log("Signature not verified");
    }
  };

  render() {
    const { web3, challenge, signature } = this.state;
    if (!web3) return "Loading...";
    return (
      <div className="App">
        <button onClick={this.getChallenge}>Get Challenge</button>
        <button onClick={this.signChallenge} disabled={!challenge}>
          Sign Challenge
        </button>
        <button onClick={this.verifySignature} disabled={!signature}>
          Verify Signature
        </button>

        {challenge && (
          <div className="data">
            <h2>Challenge</h2>
            <pre>{JSON.stringify(challenge, null, 4)}</pre>
          </div>
        )}

        {signature && (
          <div className="data">
            <h2>Signature</h2>
            <pre>{signature}</pre>
          </div>
        )}
      </div>
    );
  }
}

export default App;
