# Chicmoz - [aztecscan.xyz](https://aztecscan.xyz)

## running locally

Requirements:

- [minikube](https://minikube.sigs.k8s.io/docs/start/)
- [skaffold](https://skaffold.dev/docs/install/)
- [helm](https://helm.sh/docs/intro/install/)
- [yarn](https://yarnpkg.com/getting-started/install)

**terminal 1:**

```sh
minikube start --kubernetes-version=v1.25.3 --cpus max --memory max && skaffold run -f k8s/local/skaffold.default.yaml
```

**terminal 2:**

⚠️ _will ask for your password in order to port forward_

```sh
# It will end with keeping the terminal open for the tunnel.
./scripts/miscellaneous.sh
```

Now you can access the explorer at http://sandbox.chicmoz.localhost and also...

- API: http://api.sandbox.chicmoz.localhost
- index of API: http://api.sandbox.chicmoz.localhost/v1/dev-api-key/l2/index

### Different Aztec-setups

#### Option 0 - default

Default settings is to set up a sandbox in the local cluster.

#### Option 1 - connect to your already running sandbox or to public devnet

⚠️ _Make sure you have .chicmoz.env file in the root_

TODO

## Pro tip

### 1

if you run the explorer with `skaffold run -f k8s/local/skaffold.no_ui.yaml` you can run the explorer-ui locally for even faster frontend development:

```
yarn build:packages
cd /services/explorer-ui
yarn
yarn build
yarn dev
```
