#!/bin/bash
set -e

echo "Initializing CryptoFraud Trace databases..."
# PostgreSQL initialization is handled by docker-entrypoint-initdb.d
# Neo4j cypher initialization is loaded via cypher-shell

echo "Databases initialized."
