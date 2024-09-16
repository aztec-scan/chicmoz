## running locally

terminal 1:

```sh
minikube start --kubernetes-version=v1.25.3 --cpus max --memory max && skaffold run
```

terminal 2:

```sh
# It will end with keeping the terminal open for the tunnel. (Also it will ask for your password)
./scripts/miscallaneous.sh
```

terminal 3:
_Make sure you have .chicmoz-local.env file in the root_

```sh
cd services/explorer-ui && yarn dev
```

UI: http://localhost:5173
API: https://explorer-api.localhost:443

## Deploying on AWS

TODO: is this needed?

### Configure Load Balancer

Follow these instructions to properly configure the load balancer:

- [configure proxy protocol support](https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/enable-proxy-protocol.html)
- [configure correct ports](https://stackoverflow.com/a/56948614/8678661)

To check the port mappings run:

```sh
aws elb describe-load-balancers --load-balancer-name <my-load-balancer>
```
