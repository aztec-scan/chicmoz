kubectl scale --replicas 0 -n chicmoz-prod deployment aztec-listener
kubectl scale --replicas 0 -n chicmoz-prod deployment explorer-api
kubectl scale --replicas 0 -n chicmoz-prod deployment auth
kubectl scale --replicas 0 -n chicmoz-prod deployment websocket-event-publisher
