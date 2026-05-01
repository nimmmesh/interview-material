# DevOps / Distributed Systems Notes

## Kafka vs RabbitMQ

### Kafka

Best for: - event streaming - large scale log pipelines - analytics
pipelines

Characteristics:

-   high throughput
-   distributed log storage
-   partition based scaling

Used in:

-   telemetry pipelines
-   analytics systems

------------------------------------------------------------------------

### RabbitMQ

Best for:

-   task queues
-   request/response workflows
-   background jobs

Characteristics:

-   message broker
-   routing via exchanges
-   lower latency

------------------------------------------------------------------------

## When to Use Each

Kafka: - event sourcing - event streaming - big data pipelines

RabbitMQ: - job queues - microservice async processing - RPC messaging

------------------------------------------------------------------------

## If Rebuilding Kafka System

Possible improvements:

1.  Schema registry for message versioning
2.  Better topic partition strategy
3.  Dead letter queues
4.  Monitoring and alerting
