const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use form routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
