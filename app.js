const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');

const token = '6364322908:AAFNYSvPqSF0KzDDxqAjDjhXWbcDrGtWSaY';
const bot = new TelegramBot(token, { polling: false });

const { exec } = require('child_process');
const {join} = require("path");

const white_list = [826471500];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`;
}

function formatCommits(commits) {
    return commits.map(commit => `- ${commit.message}`).join('\n');
}

async function handleWebhook(req) {
    const { repository, sender, head_commit } = req;

    const message = `🚀 ${head_commit.author.name} (${sender.login}) was pushed to ${repository.full_name}\n` +
        `At ${formatDateTime(head_commit.timestamp)}\n` +
        `With ${head_commit.message}\n` +
        (head_commit.added.length ? `Added:\n${formatCommits(head_commit.added)}\n` : '') +
        (head_commit.removed.length ? `Removed:\n${formatCommits(head_commit.removed)}\n` : '') +
        (head_commit.modified.length ? `Modified:\n${formatCommits(head_commit.modified)}\n` : '');
    console.log(head_commit)
    console.log(message)

    for (const chatId of white_list) {
        await bot.sendMessage(chatId, message)
            .then(() => console.log(`Push sent to ${chatId} OK`))
            .catch(error => console.error(`Error sending push to ${chatId}: ${error.message}`));
    }
}


function runScript() {
    const scriptPath = join(__dirname, 'rebuild.sh');
    exec('sh ' + scriptPath, async (error, stdout, stderr) => {
        if (error) {
            const message = "Last push was build with errors\nPlease update the build manually"

            for (const chatId of white_list) {
                await bot.sendMessage(chatId, message)
                    .then(() => console.log(`Message sent to ${chatId} OK`))
                    .catch(error => console.error(`Error sending message to ${chatId}: ${error.message}`));
            }
        } else {
            const message = "Last push was build successfully"

            for (const chatId of white_list) {
                await bot.sendMessage(chatId, message)
                    .then(() => console.log(`Message sent to ${chatId} OK`))
                    .catch(error => console.error(`Error sending message to ${chatId}: ${error.message}`));
            }
        }

    });
}

router.post("/wh/", function (req, res) {
    console.log(req.body);

    try {
        handleWebhook(req.body).then(r => "")
        runScript()
    } catch (e) {
        console.error("Error processing request message:", e);
    }

    res.sendStatus(200);
});

app.use('/', router);

module.exports = app;
