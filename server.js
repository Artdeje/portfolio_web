const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public', { extensions: ['html'] }));

// Data Paths
const CONTENT_PATH = path.join(__dirname, 'data', 'content.json');
const FEEDBACK_PATH = path.join(__dirname, 'data', 'feedback.json');
const THEME_PATH = path.join(__dirname, 'data', 'theme.json');
const USERS_PATH = path.join(__dirname, 'data', 'users.json');

// Ensure data directory and files exist
const initData = async () => {
    await fs.ensureDir(path.join(__dirname, 'data'));
    if (!await fs.pathExists(CONTENT_PATH)) await fs.writeJson(CONTENT_PATH, {});
    if (!await fs.pathExists(FEEDBACK_PATH)) await fs.writeJson(FEEDBACK_PATH, []);
    if (!await fs.pathExists(THEME_PATH)) await fs.writeJson(THEME_PATH, { site: 'default', dash: 'dark' });
    if (!await fs.pathExists(USERS_PATH)) await fs.writeJson(USERS_PATH, [{ username: 'admin', password: 'andportfolio2026' }]);
};

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await fs.readJson(USERS_PATH);
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, message: 'Authenticated successfully' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    const users = await fs.readJson(USERS_PATH);
    if (users.some(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    users.push({ username, password });
    await fs.writeJson(USERS_PATH, users);
    res.json({ success: true, message: 'Account created' });
});

// --- CONTENT API ---
app.get('/api/content', async (req, res) => {
    const data = await fs.readJson(CONTENT_PATH);
    res.json(data);
});

app.put('/api/content/:section', async (req, res) => {
    const { section } = req.params;
    const data = await fs.readJson(CONTENT_PATH);
    data[section] = req.body;
    await fs.writeJson(CONTENT_PATH, data);
    res.json({ success: true, message: `${section} updated` });
});

// For array items (certs, skills, exp, blog, portfolio)
app.post('/api/content/:section', async (req, res) => {
    const { section } = req.params;
    const data = await fs.readJson(CONTENT_PATH);
    if (!data[section]) data[section] = [];
    data[section].push(req.body);
    await fs.writeJson(CONTENT_PATH, data);
    res.json({ success: true, message: 'Item added' });
});

app.delete('/api/content/:section/:index', async (req, res) => {
    const { section, index } = req.params;
    const data = await fs.readJson(CONTENT_PATH);
    if (data[section] && data[section][index]) {
        data[section].splice(index, 1);
        await fs.writeJson(CONTENT_PATH, data);
        res.json({ success: true, message: 'Item deleted' });
    } else {
        res.status(404).json({ success: false, message: 'Item not found' });
    }
});

app.put('/api/content/:section/:index', async (req, res) => {
    const { section, index } = req.params;
    const data = await fs.readJson(CONTENT_PATH);
    if (data[section] && data[section][index]) {
        data[section][index] = req.body;
        await fs.writeJson(CONTENT_PATH, data);
        res.json({ success: true, message: 'Item updated' });
    } else {
        res.status(404).json({ success: false, message: 'Item not found' });
    }
});

// --- FEEDBACK API ---
app.get('/api/feedback', async (req, res) => {
    const data = await fs.readJson(FEEDBACK_PATH);
    res.json(data);
});

app.post('/api/feedback', async (req, res) => {
    const feedback = await fs.readJson(FEEDBACK_PATH);
    feedback.push({
        ...req.body,
        date: new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    });
    await fs.writeJson(FEEDBACK_PATH, feedback);
    res.json({ success: true, message: 'Feedback received' });
});

app.delete('/api/feedback/:index', async (req, res) => {
    const { index } = req.params;
    const feedback = await fs.readJson(FEEDBACK_PATH);
    feedback.splice(index, 1);
    await fs.writeJson(FEEDBACK_PATH, feedback);
    res.json({ success: true, message: 'Feedback deleted' });
});

// --- THEME API ---
app.get('/api/theme', async (req, res) => {
    const theme = await fs.readJson(THEME_PATH);
    res.json(theme);
});

app.put('/api/theme', async (req, res) => {
    await fs.writeJson(THEME_PATH, req.body);
    res.json({ success: true, message: 'Theme updated' });
});

// Start Server
initData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});
