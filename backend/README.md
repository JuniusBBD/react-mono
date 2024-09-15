# Feature Flag System Setup on AWS

This guide provides step-by-step instructions to set up a feature flag system on AWS using AWS Systems Manager Parameter Store, an Express.js backend service, and a React frontend.

## Prerequisites

- AWS CLI installed and configured
- `eksctl` installed
- Docker installed
- Kubernetes CLI (`kubectl`) installed

## Step 1: Create an EKS Cluster

1. **Login to AWS CloudShell**:

   - Use the following to script to download eksctl tarball:

create a file named `install-eksctl.sh` and add the following code:

```sh
ARCH=amd64
PLATFORM=$(uname -s)_$ARCH

curl -sLO "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$PLATFORM.tar.gz"
```

- Change the permissions of the script:

```sh
chmod +x install-eksctl.sh
```

- Run the script:

```sh
./install-eksctl.sh
```

- Extract the binary:

```sh
 tar zxvf eksctl_$PLATFORM.tar.gz
```

- Move the binary to the `/usr/local/bin` directory:

```sh
 sudo mv eksctl /usr/local/bin
```

1. **Create an EKS cluster**:

   ```sh
   eksctl create cluster --name feature-flag-system --region us-west-2 --node-type t3.medium --nodes 1 --managed
   ```

   - Run `aws eks describe-cluster --name feature-flag-system --query "cluster.identity.oidc.issuer" --output text` to get the OIDC issuer URL. Update the `YOUR_CLUSTER_ID` in the `trust-policy.json` file with the cluster ID.
   - Run `kubectl get namespaces` to get the list of namespaces in the cluster. Update the `YOUR_NAMESPACE` in the `trust-policy.json` file with the namespace name.
   - Run `kubectl get serviceaccounts -n default` to get the list of service accounts in the default namespace, and update the `YOUR_SERVICE_ACCOUNT` in the `trust-policy.json` file with the service account name.
   - Update `<account-id>` in the `trust-policy.json` file with your AWS account ID.
   - Update `<region>` in the `trust-policy.json` file with the region where the EKS cluster is created.

## Step 2: Store Feature Flags in Parameter Store

1. **Create a new parameter**:
   ```sh
   aws ssm put-parameter --name "/feature-flags/enable-new-feature" --value "true" --type "String"
    aws ssm put-parameter --name "/feature-flags/enable-beta-feature" --value "false" --type "String"
   ```

## Step 3: Create IAM Policy and Role

1. **Create an IAM policy**:

   ```sh
   aws iam create-policy --policy-name "FeatureFlagSystemPolicy" --policy-document file://iam-policy.json
   ```

   or

- Go to the IAM console in AWS.
- Navigate to Policies and click on `Create policy`.
- Click on the `JSON` tab and paste the contents of `iam-policy.json`.
- Click on `Review policy`, give it a name, and click on `Create policy`.

2. **Create an IAM role**:

- Go to the IAM console in AWS.
- Navigate to Roles and click on `Create role`.
- Select `Another AWS account` and paste the account ID from the `iam-policy.json` file.
- Attach the `FeatureFlagSystemPolicy` policy to the role.
- Give the role a name and click on `Create role`.

3. **Update the Trust Relationship Policy**:

   ```sh
   aws iam update-assume-role-policy --role-name "FeatureFlagSystemRole" --policy-document file://trust-policy.json
   ```

   or

- Go to the IAM console in AWS.
- Navigate to Roles and click on the `FeatureFlagSystemRole`.
- Click on `Trust relationships` and click on `Edit trust relationship`.
- Replace the existing policy with the contents of `trust-policy.json` and click on `Update Trust Policy`.

## Step 4: Annotate the Kubernetes Service Account

1. **Annotate the default service account**:
   ```sh
   kubectl annotate serviceaccount default -n default eks.amazonaws.com/role-arn=arn:aws:iam::<account-id>:role/FeatureFlagSystemRole --overwrite
   ```

## Step 5: Create and Deploy the Backend Service

1. **Create the Express.js backend service**:

   - Create a new Express server using TypeScript:

```sh
mkdir express-api && cd express-api
pnpm init
pnpm add express typescript aws-sdk
pnpm add -D @types/express @types/node typescript ts-node ts-node-dev
npx tsc --init
```

- Create a new directory name `aws` and create a new file `ssm.ts` inside the `aws` directory.
- Add the following code to the `ssm.ts` file:

```typescript
import * as AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager();
const ssm = new AWS.SSM();

export async function getSecret(secretName: string) {
  const secret = await secretsManager
    .getSecretValue({ SecretId: secretName })
    .promise();

  if (!secret.SecretString) {
    throw new Error(`Secret ${secretName} not found`);
  }

  return JSON.parse(secret.SecretString);
}

export async function getParameter(paramName: string) {
  const parameter = await ssm.getParameter({ Name: paramName }).promise();

  if (!parameter.Parameter || !parameter.Parameter.Value) {
    throw new Error(`Parameter ${paramName} not found`);
  }

  return parameter.Parameter.Value;
}

export async function getParametersByPath(path: string) {
  const params = {
    Path: path,
    Recursive: true,
    WithDecryption: true,
  };
  const parameters = await ssm.getParametersByPath(params).promise();

  if (!parameters.Parameters) {
    throw new Error(`No parameters found for path ${path}`);
  }

  return parameters.Parameters.reduce((acc, param) => {
    if (!param.Name) {
      return acc;
    }

    const key = param.Name.split('/').pop();

    if (!key || !param.Value) {
      return acc;
    }

    // @ts-ignore
    acc[key] = param.Value === 'true';
    return acc;
  }, {});
}
```

- Create `index.ts` file in the root directory and add the following code:

```typescript
import express from 'express';
import { getParametersByPath } from './aws/aws-ssm';

const app = express();

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/feature-flags', async (req, res) => {
  try {
    const featureFlags = await getParametersByPath('/feature-flags');
    res.status(200).send(featureFlags);
  } catch (error) {
    res.status(500).send({ message: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

2. Dockerize the Express server:

   - Create a new file named `Dockerfile` in the root directory and add the following code:

```Dockerfile
FROM node:22-alpine3.19

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml for pnpm
COPY package*.json .
COPY pnpm-lock.yaml .

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 8080

CMD [ "pnpm", "start" ]
```

- Build the Docker image:

```sh
docker build -t express-api .
```

- Tag the Docker image:

```sh
docker tag express-api:latest <docker-hub-username>/express-api:latest
```

- Push the Docker image to a container registry:

```sh
docker push <docker-hub-username>/express-api:latest
```

3. Deploy the Docker image to the EKS cluster:
   - Create a new file named `deployment.yaml` and add the following code:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
name: feature-flag-deployment
namespace: default
spec:
replicas: 1
selector:
  matchLabels:
    app: feature-flag
template:
  metadata:
    labels:
      app: feature-flag
  spec:
    serviceAccountName: default
    containers:
      - name: my-container
        image: <docker-hub-username></docker-hub-username>/feature-aws-flag:latest
        imagePullPolicy: Always
        ports:
          - containerPort: 8080
```

- Replace `<docker-hub-username>` with your Docker Hub username.
- Deploy the backend service to the EKS cluster:

```sh
kubectl apply -f deployment.yaml
```

- Create a new file named `service.yaml` and add the following code:

```yaml
apiVersion: v1
kind: Service
metadata:
name: feature-flag-service
namespace: default
spec:
type: LoadBalancer
selector:
  app: feature-flag
ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

- Deploy the service to the EKS cluster:

```sh
kubectl apply -f service.yaml
```

- Get the external IP address of the service:

```sh
kubectl get svc feature-flag-service
```

- Visit the external IP address in your browser to see the Express server running.
- Visit the `/feature-flags` endpoint to see the feature flags stored in Parameter Store.

## Step 6: Create API Gateway

1. **Create a new API Gateway**:

   - Go to the API Gateway console in AWS.
   - Click on `Create API`.
   - Select `HTTP API` and click on `Build`.
   - Give the API a name and click on `Create`.
   - Click on `Routes` and click on `Create`.
   - Add a new route with the path `/feature-flags` and the method `GET`.
   - Click on `Create`.
   - Click on the route and click on `Integrations`.
   - Click on `Create`.
   - Select `HTTP_PROXY` and click on `Create`.
   - Enter the URL of the Express server and click on `Create`.
   - Click on the route and click on `Deploy`.
   - Give the deployment a name and click on `Deploy`.

## Troubleshooting

- If you get an error saying `User: arn:aws:sts::XX10397XXXXX:assumed-role/eksctl-feature-flag-system-nodegro-NodeInstanceRole-slCodid9blra/i-09fea4275c1727fb0 is not authorized to perform: ssm:GetParametersByPath on resource: arn:aws:ssm:eu-central-1:XX10397XXXXX:parameter/feature-flags because no identity-based policy allows the ssm:GetParametersByPath action`.

  attach the ```iam-policy.json``` to the role.

```sh
aws iam put-role-policy   --role-name eksctl-feature-flag-system-nodegro-NodeInstanceRole-slCodid9blra   --policy-name FeatureFlagSystemPolicy   --policy-document file://iam-policy.json
```
