#!/usr/bin/env bash

cd repos/builder
bun run build:windows $1

cd ../../
