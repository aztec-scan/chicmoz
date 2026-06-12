import { AztecAddress, AztecScanNote, L2NetworkId } from "@chicmoz-pkg/types";

export const SERVICE_NAME = "explorer-api";

/* ⚠️ Aztec Scan Notes ⚠️
    Aztec Scan Notes are a way to add metadata to contracts on Aztec Scan. Preferably this should be done through the Aztec Scan UI, but for now we are adding them here manually.
    If you want to have your contract added here, please create a PR to this file.
*/
export const AZTEC_SCAN_NOTES: Record<
  L2NetworkId,
  Record<AztecAddress, AztecScanNote>
> = {
  MAINNET: {
    "0x113b36e94819448bc5da1f08418ffe75c528348e984c3dbcaab5dbbdbac83667": {
      name: "USDC Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for USDC",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          note: "USDC Token",
        },
        {
          address: "0x196f85550ad28a960f259dcc23fc6f93b1347876",
          note: "USDC Portal",
        },
        {
          address: "0x4077dd4112b50186f03f2dd832065d5e5f97a61f",
          note: "USDC Capacity Provider",
        },
      ],
    },
    "0x193ae1b570a38e6de208b7b5994ac0fa78aef38ae1cc14c69f9860bca66130dc": {
      name: "Bridged USDC",
      origin: "Nyx",
      comment: "nyx.money bridged USDC",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          note: "USDC Token",
        },
        {
          address: "0x196f85550ad28a960f259dcc23fc6f93b1347876",
          note: "USDC Portal",
        },
        {
          address: "0x4077dd4112b50186f03f2dd832065d5e5f97a61f",
          note: "USDC Capacity Provider",
        },
      ],
    },
    "0x1ff16c6ab5f5cacb1f9261fe15e9053559c868c7a9409ef4fccc27a81ad3a716": {
      name: "USDT Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for USDT",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          note: "USDT Token",
        },
        {
          address: "0x77c7ca879699d63bb2368693213163aca89df9e3",
          note: "USDT Portal",
        },
        {
          address: "0x9bc89fcbd693e5e94bf3b0d3196ad669ef17a5f7",
          note: "USDT Capacity Provider",
        },
      ],
    },
    "0x2f192324b899d6c80d3feba15b871f156cd64a8126df9ae31ff1f521ccf42e82": {
      name: "Bridged USDT",
      origin: "Nyx",
      comment: "nyx.money bridged USDT",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          note: "USDT Token",
        },
        {
          address: "0x77c7ca879699d63bb2368693213163aca89df9e3",
          note: "USDT Portal",
        },
        {
          address: "0x9bc89fcbd693e5e94bf3b0d3196ad669ef17a5f7",
          note: "USDT Capacity Provider",
        },
      ],
    },
    "0x17390300503c431182cbe4624a4df19fc267843c04a1b5e2ad160edec89f9b78": {
      name: "WETH Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for WETH",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          note: "WETH Token",
        },
        {
          address: "0x016ee0b270116b5e0e59b29e10b9d85cc2182154",
          note: "WETH Portal",
        },
        {
          address: "0x3c606ac3dc3ea7db33a5bb1740dcd75178e66ad2",
          note: "WETH Capacity Provider",
        },
      ],
    },
    "0x20b2ec422eab9667e361a76051dd1a1fc84d231705681a56271a7d450142bcfc": {
      name: "Bridged WETH",
      origin: "Nyx",
      comment: "nyx.money bridged WETH",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          note: "WETH Token",
        },
        {
          address: "0x016ee0b270116b5e0e59b29e10b9d85cc2182154",
          note: "WETH Portal",
        },
        {
          address: "0x3c606ac3dc3ea7db33a5bb1740dcd75178e66ad2",
          note: "WETH Capacity Provider",
        },
      ],
    },
    "0x066ac1f63c3f268e495a3641fe82e1550c8e008cebea0a4aab06e4b21efbbb3c": {
      name: "waEthUSDC Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for Aave USDC vault share",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xD4fa2D31b7968E448877f69A96DE69f5de8cD23E",
          note: "waEthUSDC Vault",
        },
        {
          address: "0x774af49625bd20c083f7afa7eb404972804c958e",
          note: "waEthUSDC Portal",
        },
        {
          address: "0x5c03e4e3b9c3d5c8ef4ceba81dc118f652e26c29",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x1bfbf51ccc2ad4cb6d8efeca2cf3e203efdc21b6339f76ee23b3b576cc437683": {
      name: "Bridged waEthUSDC",
      origin: "Nyx",
      comment: "nyx.money bridged Aave USDC vault share",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0xD4fa2D31b7968E448877f69A96DE69f5de8cD23E",
          note: "waEthUSDC Vault",
        },
        {
          address: "0x774af49625bd20c083f7afa7eb404972804c958e",
          note: "waEthUSDC Portal",
        },
        {
          address: "0x5c03e4e3b9c3d5c8ef4ceba81dc118f652e26c29",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x2eadf8efd54c45b27254e1b90ba03486c064534f56031313523e655e0069c75d": {
      name: "waEthUSDT Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for Aave USDT vault share",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0x7Bc3485026Ac48b6cf9BaF0A377477Fff5703Af8",
          note: "waEthUSDT Vault",
        },
        {
          address: "0xa6e9a4a3d40402008c7a338d357465f63501f925",
          note: "waEthUSDT Portal",
        },
        {
          address: "0x5c03e4e3b9c3d5c8ef4ceba81dc118f652e26c29",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x23d1531dc21f26b0a2ca6bcea836d9ed55c1812db816134ce38d437e44cfd71c": {
      name: "Bridged waEthUSDT",
      origin: "Nyx",
      comment: "nyx.money bridged Aave USDT vault share",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0x7Bc3485026Ac48b6cf9BaF0A377477Fff5703Af8",
          note: "waEthUSDT Vault",
        },
        {
          address: "0xa6e9a4a3d40402008c7a338d357465f63501f925",
          note: "waEthUSDT Portal",
        },
        {
          address: "0x5c03e4e3b9c3d5c8ef4ceba81dc118f652e26c29",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x14b8faae1f6522efe8e35ffff27a72631ba48461cb982d29019f9846bcc084bd": {
      name: "waEthWETH Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for Aave WETH vault share",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0x0bfc9d54Fc184518A81162F8fB99c2eACa081202",
          note: "waEthUSD Vault",
        },
        {
          address: "0xcf226d3c1bb4b8ca97be50c8e5d7ba0ce94e379f",
          note: "waEthUSD Portal",
        },
        {
          address: "0x5c03e4e3b9c3d5c8ef4ceba81dc118f652e26c29",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x25cf4b4ef38411da87d711e121a9f0692d389dfbac922e77babab586725afc45": {
      name: "Bridged waEthWETH",
      origin: "Nyx",
      comment: "nyx.money bridged Aave WETH vault share",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0x0bfc9d54Fc184518A81162F8fB99c2eACa081202",
          note: "waEthWETH Vault",
        },
        {
          address: "0xcf226d3c1bb4b8ca97be50c8e5d7ba0ce94e379f",
          note: "waEthWETH Portal",
        },
        {
          address: "0x5c03e4e3b9c3d5c8ef4ceba81dc118f652e26c29",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x268fdc99535617a732f8063a1055b4e754fde8142bd3dd8f54447cd00af3284b": {
      name: "Token Vault Bridge",
      origin: "Nyx",
      comment: "Aave deposits and redemptions for nyx.money",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0x5c03e4e3b9c3d5c8ef4ceba81dc118f652e26c29",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x3030c7d2dd8249e9ea0a553ba29bfc492e068c874c627df295115cef96305fdb": {
      name: "Juice Bar",
      origin: "Nyx",
      comment: "Transaction sponsorship for nyx.money",
      category: "defi",
      relatedL1ContractAddresses: [],
    },
  },
  SANDBOX: {
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": {
      name: "Example",
      origin: "This is an example note",
      comment: "EXAMPLE",
      category: "dev",
      relatedL1ContractAddresses: [
        {
          address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          note: "This is an example note for the L1-contract",
        },
      ],
    },
  },
  DEVNET: {
  },
  TESTNET: {
    "0x23aa89a473816a75a38e5cbead8652fd047a0820657fd2b5ed97eba5b220a3ce": {
      name: "Bridged USDC",
      origin: "Raven House",
      comment: "Available at: https://bridge.ravenhouse.xyz",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0x3c7E4990F18bd36029CC562B336022C657427c6A",
          note: "Bridge router address",
        },
        {
          address: "0xf98F4dd494833e0C686BA80454923D916C71CeC4",
          note: "Raven House mocked 'USDC'"
        },
        {
          address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
          note: "USDC"
        }
      ],
    },
    "0x0e71563c1efe1ba273b28f14866387b917d87bcaa3036e1aa8154e608f9bb9dd": {
      name: "USDC Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for USDC",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
          note: "USDC Token",
        },
        {
          address: "0xc654f4eace3cb52fe0aacf1cc71aff9992375fbd",
          note: "USDC Portal"
        },
      ],
    },
    "0x114412475a46676e0ed5a39205ecd6ffa320f8fd9210b4517b3d715c8988e729": {
      name: "Bridged USDC",
      origin: "Nyx",
      comment: "nyx.money bridged USDC",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
          note: "USDC Token",
        },
        {
          address: "0xc654f4eace3cb52fe0aacf1cc71aff9992375fbd",
          note: "USDC Portal"
        },
      ],
    },
    "0x00989e4fd05c8f22baadff3856475ab5ec61a8964c4e420d288d9c020421dbed": {
      name: "nETH Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for nETH test token",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0x1b616cf5825a50ea7d4e630a3f0567c1b2690510",
          note: "nETH Token",
        },
        {
          address: "0x3e6c85b31f7f719951029b65073c6ed3306c1bf4",
          note: "nETH Portal"
        },
        {
          address: "0x679651390ced0f9f2cebf205a854cdf0a8f071e4",
          note: "nETH Faucet"
        },
      ],
    },
    "0x13d6b7228ca7f2d7672c2611e35148589553c1c5f932fe885ab8d550d406c738": {
      name: "Bridged nETH",
      origin: "Nyx",
      comment: "nyx.money bridged nETH test token",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0x1b616cf5825a50ea7d4e630a3f0567c1b2690510",
          note: "nETH Token",
        },
        {
          address: "0x3e6c85b31f7f719951029b65073c6ed3306c1bf4",
          note: "nETH Portal"
        },
        {
          address: "0x679651390ced0f9f2cebf205a854cdf0a8f071e4",
          note: "nETH Faucet"
        },
      ],
    },
    "0x2a9c7e963f16baa8a48a5fe2fbdf2e732e3f8a72adbbd1fd7aa7f3cfc39689b3": {
      name: "nBTC Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for nBTC test token",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xf664b0f8fa6b5f4ac445446851f75185d20a71cd",
          note: "nBTC Token",
        },
        {
          address: "0xa9067393f6a9d8052cbbf646f79390f88fa9fa27",
          note: "nBTC Portal"
        },
        {
          address: "0x991abf3b0a97466146b9b9f3190e9c6c09e5308a",
          note: "nBTC Faucet"
        },
      ],
    },
    "0x21a5b96f6b2ccaef2f894f0cf85c23445c7b284b7a37446685e2b66c4a83040a": {
      name: "Bridged nBTC",
      origin: "Nyx",
      comment: "nyx.money bridged nBTC test token",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0xf664b0f8fa6b5f4ac445446851f75185d20a71cd",
          note: "nBTC Token",
        },
        {
          address: "0xa9067393f6a9d8052cbbf646f79390f88fa9fa27",
          note: "nBTC Portal"
        },
        {
          address: "0x991abf3b0a97466146b9b9f3190e9c6c09e5308a",
          note: "nBTC Faucet"
        },
      ],
    },
    "0x2ad26571da28293c467df78c0a06ab96379d6d34e4b9f92324fddd1aeebdebd3": {
      name: "sUSDC Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for sUSDC test vault share",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xc77f84b5277b67cc7863634072d792a18a458db1",
          note: "sUSDC Vault",
        },
        {
          address: "0x9e836f55ac6f6aa911fce72cefb9066fbba635c4",
          note: "sUSDC Portal"
        },
        {
          address: "0xe245ff99c55f416c9a7e21f99345c4b981b13223",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x1866cc8009a34b9f1d765b9f1ed74e3fc629a56a1d989572b52d1c2528c1a2c6": {
      name: "Bridged sUSDC",
      origin: "Nyx",
      comment: "nyx.money bridged sUSDC test vault share",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0xc77f84b5277b67cc7863634072d792a18a458db1",
          note: "sUSDC Vault",
        },
        {
          address: "0x9e836f55ac6f6aa911fce72cefb9066fbba635c4",
          note: "sUSDC Portal"
        },
        {
          address: "0xe245ff99c55f416c9a7e21f99345c4b981b13223",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x0e8f1a42b6a0f835aff4b012ec76787685a3adf08930632e810d46db08230471": {
      name: "snETH Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for snETH test vault share",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0x5b65d1c17d4c7edc344139b29016d0275ca65630",
          note: "snETH Vault",
        },
        {
          address: "0x89b042b79a998629d10919a41a98790c24e3c8f9",
          note: "snETH Portal"
        },
        {
          address: "0xe245ff99c55f416c9a7e21f99345c4b981b13223",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x2c042bd9b2d9adac2cf74695f7d125caf3488022566facd03c6e9729c1a569a8": {
      name: "Bridged snETH",
      origin: "Nyx",
      comment: "nyx.money bridged snETH test vault share",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0x5b65d1c17d4c7edc344139b29016d0275ca65630",
          note: "snETH Vault",
        },
        {
          address: "0x89b042b79a998629d10919a41a98790c24e3c8f9",
          note: "snETH Portal"
        },
        {
          address: "0xe245ff99c55f416c9a7e21f99345c4b981b13223",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x118a7246a612e9e839dcb0d2de5cfb641ac9f3cd2b28bf4500f1dd879ef00ebf": {
      name: "snBTC Bridge",
      origin: "Nyx",
      comment: "nyx.money bridge for snBTC test vault share",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xba536d90f16d1e836e899c6fa1f14f83755dc061",
          note: "snBTC Vault",
        },
        {
          address: "0x88d352a676cca74f9f3f69f287c1f1eabcaddeb1",
          note: "snBTC Portal"
        },
        {
          address: "0xe245ff99c55f416c9a7e21f99345c4b981b13223",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x07da7442ab3a800f4b22f664e4817f97cb93b7a07f9f586063d320f3e11b4dd5": {
      name: "Bridged snBTC",
      origin: "Nyx",
      comment: "nyx.money bridged snBTC test vault share",
      category: "defi",
      relatedL1ContractAddresses: [
        {
          address: "0xba536d90f16d1e836e899c6fa1f14f83755dc061",
          note: "snBTC Vault",
        },
        {
          address: "0x88d352a676cca74f9f3f69f287c1f1eabcaddeb1",
          note: "snBTC Portal"
        },
        {
          address: "0xe245ff99c55f416c9a7e21f99345c4b981b13223",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x22d506a1e5998d97f3602a974b6e5a6f3560f000cd8dfc2400fc78687dc45a49": {
      name: "Token Vault Bridge",
      origin: "Nyx",
      comment: "Nyx vault deposits and redemptions for nyx.money",
      category: "bridge",
      relatedL1ContractAddresses: [
        {
          address: "0xe245ff99c55f416c9a7e21f99345c4b981b13223",
          note: "Token Vault Portal",
        },
      ],
    },
    "0x2acf0d0ace977851ab004073223058f5f88e63b80428748b8fb4bc4d441a6644": {
      name: "Juice Bar",
      origin: "Nyx",
      comment: "Transaction sponsorship for nyx.money",
      category: "defi",
      relatedL1ContractAddresses: [],
    },
  },
};

export const AZTEC_SCAN_MANUAL_SOURCE_CODE_URLS: Record<
  L2NetworkId,
  Record<AztecAddress, string>
> = {
  MAINNET: {},
  SANDBOX: {},
  TESTNET: {
    //  "0x1848f4a84947391632f106de66335b649b8356b05f64feed80889d899ee82187":
    //    "https://github.com/defi-wonderland/aztec-standards/tree/9fcc5cabca6054053e54b1b48798e37b4bb0f685/src/token_contract",
  },
  DEVNET: {},
};
