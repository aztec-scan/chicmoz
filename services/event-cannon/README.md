# Contract projects

`src/contract-projects/` contains the Aztec contract projects used by event-cannon. Current projects:

- `SimpleLogging/`
- `SimpleLoggingUpdate/`

## Compile contracts (if changed or updated version)

```sh
aztec-up install 4.0.0-devnet.2-patch.1
aztec-up use 4.0.0-devnet.2-patch.1

cd src/contract-projects/YOUR_PROJECT
aztec compile

aztec codegen target --outdir ../../artifacts
```

## Foundry path note

If `forge` is installed but Aztec cannot find it, ensure the Foundry bin path is exported in your shell before running `aztec compile`:

```sh
export PATH="$HOME/.foundry/bin:$PATH"
```
