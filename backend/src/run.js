import { startServer } from './server.js';
const port = Number(process.env.PORT || 3001);
const { url } = await startServer(port);
console.log(`backend ready at ${url}`);
