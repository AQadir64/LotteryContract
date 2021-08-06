const assert = require('assert');
const ganache = require('ganache-cli');
const { IncomingMessage } = require('http');
const Web3 = require('web3');
const { interface, bytecode } = require('../compile');
const web3 = new Web3(ganache.provider());

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode,
    })
    .send({ from: accounts[0], gas: '1000000' });
});

describe('lottery contract', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('allow minimum amount of ethers to send', async () => {
    try {
      const transaction = await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei('0.001', 'ether'),
      });
      assert(false);
    } catch (err) {
      assert.ok(err);
    }
  });

  it('allow one account to enter', async () => {
    const transaction = await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    console.log({ transaction });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it('allow multiple accounts to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether'),
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.04', 'ether'),
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.05', 'ether'),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });
});
