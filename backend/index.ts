import express from 'express';
import { getParameter, getParametersByPath } from './aws/aws-ssm';

const app = express();

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/parameter', async (req, res) => {
  try {
    const parameter = await getParameter(req.query.name as string);
    res.status(200);
    res.json(parameter);
  } catch (error) {
    res.status(500);
    res.json({ error: (error as Error).message });
  }
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