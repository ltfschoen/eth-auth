const NodeCache = require('node-cache');
const ethUtil = require('ethereumjs-util');
const sigUtil = require('eth-sig-util');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');

const secret = uuidv4();
let cache = new NodeCache({
  stdTTL: 600
});

class MetaAuth {
  constructor(options) {
    return (req, res, next) => {
      const DEFAULT_OPTIONS = {
        signature: 'MetaSignature',
        message: 'MetaMessage',
        address: 'MetaAddress',
        dAppName: '*** WARNING *** Put your dApp name *** WARNING ***',
        action: 'Authentication'
      }

      this.options = Object.assign(
        DEFAULT_OPTIONS,
        options
      )

      // Address param is passed & isValidAddress
      if (req.params[this.options.address]) {
        const address = req.params[this.options.address];

        if (ethUtil.isValidAddress(address)) {
          const challenge = this.createChallenge(address);
          let json = {
            challenge
          }
          req.metaAuth = json;
        }
      }

      // Challenge message returned with signature
      if (req.params[this.options.message] &&
        req.params[this.options.signature]) {

        const recovered = this.checkChallenge(
          req.params[this.options.message],
          req.params[this.options.signature]
        )
        let token = {
          recovered
        }
        req.metaAuth = token;
      }

      next();
    }
  }

  createChallenge(address) {
    const hash = crypto.createHmac('sha256', secret)
      .update(address + uuidv4())
      .digest('hex');

    cache.set(address.toLowerCase(), hash);

    const domain = [
      {name:'dApp' , type:'string'},
      {name:'action', type:'string'}
    ]

    const message = [
      {name:'challenge', type:'string'}
    ]

    const domainData = {
      dApp: this.options.dAppName,
      action: this.options.action
    }

    const messageData = {
      challenge: hash
    }


    const challenge = JSON.stringify({
      types: {
          EIP712Domain: domain,
          Challenge: message
      },
      domain: domainData,
      primaryType: "Challenge",
      message: messageData
    })

    return challenge;
  }

  async checkChallenge(challenge, sig) {
    const domain = [
      {name:'dApp' , type:'string'},
      {name:'action', type:'string'}
    ]

    const message = [
      {name:'challenge', type:'string'}
    ]

    const domainData = {
      dApp: this.options.dAppName,
      action: this.options.action
    }

    const messageData = {
      challenge: challenge
    }

    const data = {
      types: {
          EIP712Domain: domain,
          Challenge: message
      },
      domain: domainData,
      primaryType: "Challenge",
      message: messageData
    }
   

    const recovered = await sigUtil.recoverTypedSignature({
      data,
      sig
    });

    const storedChallenge = cache.get(recovered.toLowerCase());

    if (storedChallenge === challenge) {
      cache.del(recovered);
      return recovered;
    }
    return false;
  }
}


module.exports = MetaAuth;

