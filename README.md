# Kafka UI
It's UI for Kafka Orchestration.

## Getting Started

It support UI and REST endpoint for Create/Delete/Update Service.

### Building
docker build -t kafka-manager-ui:1.0 -f Dockerfile .

### Running
docker run -p 8090:8090 kafka-manager-ui:1.0

### Tagging
docker tag <image-id> iad.ocir.io/odx-platform/kafka-manager-ui/kafka-manager-ui:1.1

### Pushing
docker push iad.ocir.io/odx-platform/kafka-manager-ui/kafka-manager-ui:1.1

## UI

http://localhost:8090

## Curl Commands

curl http://localhost:8090/api/services/

curl -X POST http://localhost:8090/api/services -H "Content-Type: application/json" -d '{"name":"TestNaman", "shape": "kafka-plan-2"}'

curl http://localhost:8090/api/services/TestNaman

curl -X DELETE http://localhost:8090/api/services/TestNaman

## Authors
* **Naman Mehta (naman.mehta@oracle.com)**
