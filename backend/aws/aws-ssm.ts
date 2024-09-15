import * as AWS from "aws-sdk";

const secretsManager = new AWS.SecretsManager();
const ssm = new AWS.SSM();

export async function getSecret(secretName: string) {
  const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();

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
    WithDecryption: true
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