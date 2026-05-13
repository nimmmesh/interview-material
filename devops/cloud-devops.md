# Cloud & DevOps — Interview Preparation

---

## Core Concepts

### Cloud Service Models

| Model | You Manage | Provider Manages | Example |
|-------|-----------|-----------------|---------|
| **On-Premises** | Everything | Nothing | Your own data center |
| **IaaS** | OS, apps, data, middleware | Hardware, networking, storage | Azure VMs, AWS EC2 |
| **PaaS** | App + data only | Everything else | Azure App Service, Heroku |
| **SaaS** | Nothing (just use it) | Everything | Microsoft 365, Gmail |

---

## Deep Dive

### Azure App Service
- HTTP-based PaaS for web apps, REST APIs, mobile backends.
- Supports .NET, Java, Node.js, Python, PHP.
- Runs on both Windows and Linux.

**Scaling:**
| Type | What | Example |
|------|------|---------|
| **Scale Up** | Upgrade plan (more CPU/RAM) | Basic → Standard |
| **Scale Out** | Add more instances | 1 → 5 instances |
| **Auto-scaling** | Rule-based instance management | Scale on CPU > 70% |

Auto-scaling available on **Standard plan and above**. Based on conditions: CPU %, DataIn/Out, HTTP queue length.

**Key features by plan tier:**

| Feature | Basic | Standard | Premium |
|---------|-------|----------|---------|
| Auto-scaling | No | Yes | Yes |
| Deployment slots | No | Yes | Yes |
| SSL/TLS | No | Yes | Yes |
| Backups | No | Yes | Yes |

**Deployment Slots:** Separate environments (dev, staging, prod) under one App Service. Swap slots for zero-downtime deployments.

**Zone Redundancy:** Deploy across 3 availability zones. Protects against datacenter failures. Ensures disaster recovery.

### Azure Container Services

| Service | Purpose |
|---------|---------|
| **Container Instances (ACI)** | Run containers without managing VMs. Quick, serverless. |
| **Container Registry (ACR)** | Private Docker image registry in Azure. Store and manage images. |

### Azure Functions (Serverless)

- Run code without provisioning servers. Pay only when code runs.
- **Consumption Plan:** Scale automatically based on incoming events.
- **Development:** Portal, VS Code, or any editor.

**Trigger types:** HTTP, Timer, Blob Storage, Cosmos DB, Service Bus Queue, Event Hub, Kafka.

**Authorization levels:** Function, Anonymous, Admin.

**Durable Functions** — stateful serverless:
```
HTTP Starter → triggers → Orchestrator → calls → Activity Functions
```
- **Orchestrator:** Defines the workflow sequence.
- **Activity Functions:** Individual units of work invoked by orchestrator.
- Use case: Long-running workflows, fan-out/fan-in, human interaction patterns.

---

### Message Brokers: Kafka vs RabbitMQ

| | Kafka | RabbitMQ |
|-|-------|----------|
| Model | Distributed log / event stream | Message broker / queue |
| Throughput | Very high | Moderate |
| Ordering | Per-partition ordering | Per-queue ordering |
| Retention | Persists messages (configurable) | Removes after consumption |
| Scaling | Partition-based | Queue-based |
| Latency | Higher | Lower |
| Best for | Event sourcing, log pipelines, analytics | Task queues, RPC, background jobs |

**When to use Kafka:**
- Event streaming / event sourcing
- Big data pipelines
- Telemetry & analytics
- When consumers need to replay events

**When to use RabbitMQ:**
- Job/task queues
- Microservice async communication
- Request/response (RPC) messaging
- When you need complex routing (exchanges)

**Kafka improvements to consider:**
1. Schema registry for message versioning
2. Better topic partition strategy
3. Dead letter queues for failed messages
4. Monitoring and alerting

---

## Real-World Usage

### Typical Cloud Architecture for .NET Microservices
```
Client → API Gateway (load balancing, auth)
           ├── Service A (Azure App Service)
           ├── Service B (Azure Functions)
           └── Service C (Container Instance)
                   ↓
              Message Broker (Kafka/RabbitMQ)
                   ↓
              Database (SQL Server / Cosmos DB)
              Cache (Redis)
              Storage (Blob)
```

### Key DevOps Tools

| Tool | Purpose |
|------|---------|
| **Docker** | Containerize applications |
| **Kubernetes** | Container orchestration at scale |
| **Jenkins** | CI/CD pipeline automation |
| **Nginx** | Reverse proxy, load balancer |
| **AWS Lambda** | Serverless compute (AWS equivalent of Azure Functions) |
| **S3** | Object storage (AWS) |

---

## Azure Key Vault

> ***Centralized secret management. Never hardcode secrets in code, Git, or appsettings.***

**What it stores:** DB connection strings, JWT secret keys, OAuth secrets, API keys, SSL certificates, storage account keys.

**Why use it:**

| Benefit | Details |
|---------|--------|
| **Security** | Secrets out of source code, Git repos, Docker images, appsettings.json |
| **Centralized** | Rotate secrets without redeploying applications |
| **Access control** | RBAC, access policies, Managed Identity authentication |

### Integration in .NET (Program.cs)

```csharp
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{vaultName}.vault.azure.net/"),
    new DefaultAzureCredential());
```

**Authentication flow (Managed Identity):**
```
App starts → Azure authenticates via Managed Identity → Connects to Key Vault
→ Secrets fetched securely → IConfiguration exposes values to application
```

> ⚡ **No username/password in code.** Managed Identity handles auth automatically.

**Accessing secrets:**
```csharp
var conn = builder.Configuration["DbConnectionString"];
// App doesn't care if value came from appsettings.json, env vars, or Key Vault
```

### Config Source Hierarchy

| Source | Purpose |
|--------|--------|
| `appsettings.json` | Non-sensitive app configs |
| Environment Variables | Environment-specific configs |
| **Azure Key Vault** | **Sensitive secrets & credentials** |

> ⚠️ **Key Vault is NOT configured in `launchSettings.json`** — that file is for local dev only (IIS profiles, local env vars).

**Real-world practice:** Local dev → user-secrets / env variables. QA/Production → Azure Key Vault.

**Senior-level answer:** "Azure Key Vault is a centralized secret management service for storing sensitive configs like connection strings and API keys. In .NET, it integrates in Program.cs using AddAzureKeyVault() with Managed Identity, allowing secrets to be fetched at runtime without hardcoding them in source code or config files."

---

## Tradeoffs & Pitfalls

- **PaaS vs IaaS:** PaaS = faster development, less control. IaaS = full control, more maintenance.
- **Consumption plan limits:** Cold starts, execution timeout (5 min default, 10 max). Use Premium plan for latency-sensitive functions.
> ⚠️ **Kafka overkill:** Don't use Kafka for simple job queues. RabbitMQ is simpler and lower latency.
- **Deployment slots swap:** Always test in staging slot first. Swap = instant, no downtime.
- **Auto-scaling costs:** Scale-out rules without scale-in limits = unexpected bills.
- **Container vs Serverless:** Containers for persistent workloads. Serverless for event-driven, sporadic loads.

---

## Docker Container vs Kubernetes Pod

| | Docker Container | Kubernetes Pod |
|-|-----------------|----------------|
| **What** | Single running instance of an image | Smallest deployable unit in K8s (one or more containers) |
| **Scope** | One process/application | Group of tightly coupled containers |
| **Networking** | Own network namespace (bridge by default) | All containers in a pod **share the same IP and port space** |
| **Storage** | Volumes mounted per container | Shared volumes across containers in the pod |
| **Lifecycle** | Managed by Docker daemon | Managed by Kubernetes control plane |
| **Scaling** | Manual (`docker run`) or Compose replicas | Declarative via Deployments, ReplicaSets, HPA |
| **Self-healing** | No (stays stopped if crashed) | Yes — K8s restarts failed pods automatically |
| **Service discovery** | Manual linking or Docker networks | Built-in DNS and Service abstraction |

### Key Concepts

```
DOCKER CONTAINER:
  - Runs a single image (one process per container best practice)
  - Created from a Dockerfile → Image → Container
  - docker run, docker-compose up

KUBERNETES POD:
  - Wraps one or more containers that share network + storage
  - Sidecar pattern: main app container + helper containers (logging, proxy)
  - Pods are ephemeral — never restarted, always replaced
  - Managed by higher-level objects: Deployment, StatefulSet, DaemonSet
```

### Sidecar Pattern Example
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-sidecar
spec:
  containers:
    - name: app            # Main application
      image: my-app:latest
      ports:
        - containerPort: 8080
    - name: log-agent      # Sidecar for log forwarding
      image: fluentd:latest
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
  volumes:
    - name: shared-logs
      emptyDir: {}
```

> 💡 **Think of it this way:** A Docker container is like a single apartment. A Kubernetes pod is like a suite — multiple rooms (containers) sharing the same address, hallway, and utilities.

---

## Interview Questions — Rapid Fire

| # | Question | Answer |
|---|----------|--------|
| 1 | **IaaS vs PaaS vs SaaS?** | IaaS = manage OS+apps. PaaS = manage app+data. SaaS = just use it |
| 2 | **Azure App Service?** | PaaS for web apps/APIs. Auto-scaling, deployment slots, SSL |
| 3 | **Scale Up vs Scale Out?** | Up = bigger machine. Out = **more instances** |
| 4 | **Deployment slots?** | Separate environments under one App Service. Swap for **zero-downtime** releases |
| 5 | **Azure Functions?** | Serverless compute. Triggers: HTTP, Timer, Blob, Queue. **Pay per execution** |
| 6 | **Durable Functions?** | Stateful serverless. Orchestrator coordinates activity functions in sequence |
| 7 | **Kafka vs RabbitMQ?** | Kafka = event streaming, high throughput. RabbitMQ = task queues, lower latency |
| 8 | **Docker?** | Packages app + dependencies into a **portable container** |
| 9 | **Kubernetes?** | Orchestrates containers at scale — deployment, scaling, self-healing |
| 10 | **Availability zones?** | Physically separate datacenters. Min **3** per region for redundancy |

---

## Quick Reference

```
CLOUD:      On-Prem → IaaS → PaaS → SaaS  (less control, less management)
AZURE:      App Service (PaaS) | Functions (serverless) | ACI (containers) | ACR (registry)
SCALING:    Up (bigger) | Out (more) | Auto (rules-based)
PLANS:      Basic < Standard < Premium  (auto-scale from Standard+)
FUNCTIONS:  Triggers: HTTP|Timer|Blob|Queue|EventHub|Kafka
            Auth: Function|Anonymous|Admin
            Durable: Starter→Orchestrator→Activities
MESSAGING:  Kafka (event stream, high throughput) | RabbitMQ (task queue, low latency)
CONTAINERS: Docker (package) | K8s (orchestrate) | ACI (serverless containers)
DEVOPS:     Jenkins (CI/CD) | Nginx (reverse proxy) | Docker + K8s
```
