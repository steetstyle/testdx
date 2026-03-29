# ML Pipeline Test Scenarios
# These scenarios are designed to train ML models for observability anomaly detection

## Scenario 1: Database Deadlock (XGBoost / Deep Learning)
- **File**: `database-deadlock-xgboost.yaml`
- **Algorithm**: Gradient Boosting (XGBoost) or Deep Learning (Multi-Modal)
- **Goal**: Teach model to cross-reference Logs, Metrics, and Traces using shared trace_id
- **Service**: inventory-api
- **Distribution**: Gaussian + Burst
- **Variables**:
  - Baseline: queryDurationMs (gaussian: mean=50, stdDev=10), cpuUsage (gaussian: mean=30, stdDev=5)
  - Anomaly: queryDurationMs (gaussian: mean=8500, stdDev=500), cpuUsage (gaussian: mean=98, stdDev=2)

## Scenario 2: Memory Leak (Polynomial Regression)
- **File**: `memory-leak-polynomial.yaml`
- **Algorithm**: Polynomial Regression
- **Goal**: Teach model to recognize exponential curves to predict crash before it happens
- **Service**: payment-processor
- **Distribution**: Gaussian + Exponential
- **Variables**:
  - Baseline: memoryUsage (gaussian: mean=104MB, stdDev=5MB), latencyMs (gaussian: mean=150, stdDev=20)
  - Anomaly: memoryUsage (gaussian: mean=180MB, stdDev=15MB), latencyMs (gaussian: mean=900, stdDev=150)

## Scenario 3: Redis Outage (Classifier / NLP)
- **File**: `redis-outage-classifier.yaml`
- **Algorithm**: Logistic Regression / NLP Classifier (SVM)
- **Goal**: Teach model to detect sudden bursts of anomalous text patterns
- **Service**: auth-service
- **Distribution**: Gaussian + Burst
- **Variables**:
  - Baseline: latencyMs (gaussian: mean=45, stdDev=10), poolSize (gaussian: mean=10, stdDev=1)
  - Anomaly: latencyMs (gaussian: mean=5000, stdDev=500), poolSize (gaussian: mean=0, stdDev=1)

---

## Usage

Import these YAML files into TestDX to create the scenarios. Each file contains:
- Project and Service definitions
- Baseline scenario (normal state with Gaussian distributions)
- Anomaly scenario (failure event with Gaussian/Burst distributions)
- Distribution-based variables with realistic ranges
