import express from 'express';
import searchRouter from './searchController.js';


const app = express();
app.use(express.json());
app.use('/api', searchRouter);

app.listen(3000, () => {
  
  console.log('Search service running on http://localhost:3000');
});
