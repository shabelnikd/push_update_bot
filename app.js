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
    return `${date.toLocaleDateString().replace('/', '.')} - ${date.toLocaleTimeString()}`;
}

async function handleWebhook(req) {
    const { repository, sender, head_commit } = req;

    const message = `🚀 ${head_commit.author.name} (${sender.login}) was pushed to ${repository.full_name}\n` +
        `At ${formatDateTime(head_commit.timestamp)}\n` +
        `With a commit message:\n${head_commit.message}\n` +
        (head_commit.added.length ? `Added:\n${head_commit.added}\n` : '') +
        (head_commit.removed.length ? `Removed:\n${head_commit.removed}\n` : '') +
        (head_commit.modified.length ? `Modified:\n${head_commit.modified}\n` : '');

    for (const chatId of white_list) {
        await bot.sendMessage(chatId, message)
            .then(() => console.log(`Push sent to ${chatId} OK`))
            .catch(error => console.error(`Error sending push to ${chatId}: ${error.message}`));
    }
}


function runScript() {
    const a_time = Date.now()
    const scriptPath = join(__dirname, 'rebuild.sh');
    exec('sh ' + scriptPath, async (error, stdout, stderr) => {
        if (error || stderr) {
            const message = "And last push was build with errors\nPlease update the build manually"
            console.log(message)
            for (const chatId of white_list) {
                await bot.sendMessage(chatId, message)
                    .then(() => console.log(`Message sent to ${chatId} OK`))
                    .catch(error => console.error(`Error sending message to ${chatId}: ${error.message}`));
            }
        } else {
            const message = `And last push was build successfully\nBuild was took ${Date.now() - a_time / 1000} s.`
            console.log(message)
            for (const chatId of white_list) {
                await bot.sendMessage(chatId, message)
                    .then(() => console.log(`Message sent to ${chatId} OK`))
                    .catch(error => console.error(`Error sending message to ${chatId}: ${error.message}`));
            }
        }

    });
}

router.post("/wh/", function (req, res) {

    try {
        handleWebhook(req.body).then(() => "")
        runScript()
    } catch (e) {
        console.error("Error processing request message:", e);
    }

    res.sendStatus(200);
});

app.use('/', router);

module.exports = app;
