kubectl scale statefulset --replicas 0 -n chicmoz-prod kafka-controller
kubectl scale deployment --replicas 0 -n chicmoz-prod redis-cache
kubectl scale statefulset --replicas 0 -n chicmoz-prod postgresql
