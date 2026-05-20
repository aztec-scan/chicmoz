# Ethereum Listener Proof Data Example

Use this local testnet block to verify that L1 proof data is visible through the API and UI.

## Block

- Network: Aztec testnet on Ethereum Sepolia
- Block number: `104`
- Block hash: `0x137910092401608e897229f92e9e942775431ec1a72929e85194342425816a14`

## Expected proof fields

- Prover: `0x2DEF3e4D6d5d0ffe3d681193d88E941D9644a09f`
- Proposal tx: `0x061b237a23d14b081b3a8c283dc449333a94cf7a83080997b7a2ab3fd3eddc0d`
- Proposal L1 block: `10400979`
- Proposal L1 block hash: `0x680e394bbc4fde25b80e63cc4f0b83d683022c36e90a0dd4f69da3f00bd5f750`
- Prover: `0x8FE5B4c99C9D1B71c6405a63FD5194018fDC3217`
- Proof tx: `0x9e22df9f0b86e6f7fd5934410be22bc188ab4a3e17f29005973c51884acdd6c8`
- Proof L1 block hash: `0x315b50dbfb49edec34faae6f8950b3e64330796199b761974a531c1e37a82c70`

## API

```sh
curl http://api.testnet.chicmoz.localhost/v1/l2/blocks/104
```

The response should include:

```json
{
  "height": "104",
  "hash": "0x137910092401608e897229f92e9e942775431ec1a72929e85194342425816a14",
  "proposedOnL1": {
    "l1BlockNumber": "10400979",
    "l1BlockHash": "0x680e394bbc4fde25b80e63cc4f0b83d683022c36e90a0dd4f69da3f00bd5f750",
    "l1TransactionHash": "0x061b237a23d14b081b3a8c283dc449333a94cf7a83080997b7a2ab3fd3eddc0d",
    "isFinalized": true
  },
  "proofVerifiedOnL1": {
    "l1BlockHash": "0x315b50dbfb49edec34faae6f8950b3e64330796199b761974a531c1e37a82c70",
    "proverId": "0x8FE5B4c99C9D1B71c6405a63FD5194018fDC3217",
    "l1TransactionHash": "0x9e22df9f0b86e6f7fd5934410be22bc188ab4a3e17f29005973c51884acdd6c8",
    "isFinalized": true
  }
}
```

## UI

Open either of these in the v2 local UI:

- `http://v2.testnet.chicmoz.localhost/blocks/104`
- `http://v2.testnet.chicmoz.localhost/blocks/0x137910092401608e897229f92e9e942775431ec1a72929e85194342425816a14`

The block details page should show:

```text
L1 block
#10,400,979 · ethereum

L1 block hash
0x680e394bbc4f...69da3f00bd5f750

Proposal tx
0x061b237a23d1...b7a2ab3fd3eddc0d

Prover
0x8FE5B4c99C9D1B71c6405a63FD5194018fDC3217

Proof tx
0x9e22df9f0b86e6f7fd5934410be22bc188ab4a3e17f29005973c51884acdd6c8
```
