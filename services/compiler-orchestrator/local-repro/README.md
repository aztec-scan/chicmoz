Temporary local repro scripts for compiler-orchestrator.

Scripts:

- `01-start-container.sh` - start the compiler image detached with the repro script mounted in
- `02-run-mounted-script.sh` - exec the mounted repro script inside the running container
- `03-exec-shell.sh` - open an interactive shell in the running container
- `04-cleanup-container.sh` - stop and remove the repro container
- `compile-repro.sh` - the mounted script that reproduces the prod compile flow

Defaults target:

- repo: `https://github.com/defi-wonderland/aztec-standards.git`
- ref: `v4.2.0-aztecnr-rc.2`
- subpath: `src/token_contract`
- image: `registry.digitalocean.com/aztlan-containers/contract-compiler-mainnet:v4.2.0-aztecnr-rc.2`

Typical usage:

```bash
./services/compiler-orchestrator/local-repro/01-start-container.sh
./services/compiler-orchestrator/local-repro/02-run-mounted-script.sh
./services/compiler-orchestrator/local-repro/03-exec-shell.sh
./services/compiler-orchestrator/local-repro/04-cleanup-container.sh
```
