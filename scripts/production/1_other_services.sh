kubectl scale statefulset --replicas 1 -n chicmoz-prod kafka-controller
kubectl scale deployment --replicas 1 -n chicmoz-prod redis-cache
kubectl scale statefulset --replicas 1 -n chicmoz-prod postgresql
