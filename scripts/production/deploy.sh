#!/bin/bash

set -e

VERSION_STRING="$(git describe --tags)" skaffold run --filename "k8s/production/skaffold.light.yaml" --default-repo=registry.digitalocean.com/aztlan-containers --build-concurrency=0
