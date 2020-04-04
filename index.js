require('dotenv').config()
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
const axios = require('axios')

const TELEGRAM_API_BASE = "https://api.telegram.org/bot"
const SEND_MESSAGE = "/sendMessage"
const DELETE_MESSAGE = "/deleteMessage"
const charEmojiMap = require("./charEmojiMap.js")

app.use(bodyParser.json()) // for parsing application/json
app.use(
  bodyParser.urlencoded({
    extended: true
  })
) // for parsing application/x-www-form-urlencoded

var gameCharList = [];

function getUserDetails(chat, from) {
  var first_name = chat.first_name ? chat.first_name : from.first_name
  var last_name = chat.last_name ? chat.last_name : from.last_name

  return [first_name, last_name]
}

function gameExists(chat_id) {
  return gameCharList.findIndex(game => game.chat_id === chat_id)
}

function createGame(chat_id) {
  var claims = []
  gameCharList.push({
    "chat_id": chat_id,
    "claims": claims
  });
  return gameCharList.findIndex(game => game.chat_id === chat_id)
}

function claimExists(game_id, first_name, last_name) {
  return gameCharList[game_id]
    .claims
    .findIndex(user => user.first_name === first_name && user.last_name === last_name)
}

function createClaim(game_id, first_name, last_name, claim) {
  gameCharList[game_id]
    .claims
    .push({
      "first_name": first_name,
      "last_name": last_name,
      "claim": claim
    })
}

function updateClaim(game_id, claim_id, claim) {
  gameCharList[game_id]
    .claims[claim_id]
    .claim = claim
}

function prepareClaimMessage(claims) {
  var claim_message = "";
  claims.forEach(function (item) {
    var name = item.first_name
    name = item.last_name ? name.concat(" ", item.last_name) : name
    var claim = item.claim
    claim = (claim in charEmojiMap) ? claim.concat(" ", charEmojiMap[claim]) : claim
    claim_message = claim_message.concat("*", name,  "*", " claims ", claim, "\n")
  })
  return claim_message
}

function updateMessageId(game_id, message_id) {
  gameCharList[game_id]
    .message_id = message_id
}

async function handleClaim(message, claim, res) {
  var chat = message.chat
  var from = message.from
  var first_name, last_name
  [first_name, last_name] = getUserDetails(chat, from)

  var game_id
  var new_game = false

  if ((game_id = gameExists(chat.id)) === -1) {
    new_game = true
    game_id = createGame(chat.id)
  }

  var claim_id
  if ((claim_id = await claimExists(game_id, first_name, last_name)) === -1) {
    createClaim(game_id, first_name, last_name, claim)
  } else {
    updateClaim(game_id, claim_id, claim)
  }

  var claim_message = prepareClaimMessage(gameCharList[game_id].claims)

  if (!new_game) {
    try {
      await axios.post(TELEGRAM_API_BASE + process.env.BOT_TOKEN + DELETE_MESSAGE,
        {
          chat_id: chat.id,
          message_id: gameCharList[game_id].message_id
        })
    } catch (err) {
      console.log('Error :', err)
      res.end('Error :' + err)
    }
  }

  try {
    var response = await axios.post(TELEGRAM_API_BASE + process.env.BOT_TOKEN + SEND_MESSAGE,
      {
        chat_id: chat.id,
        text: claim_message,
        parse_mode: 'Markdown'
      })
    updateMessageId(game_id, response.data.result.message_id)
  } catch (err) {
    console.log('Error :', err)
    res.end('Error :' + err)
  }

  console.log('Claim sent')
  res.send('ok')
}

async function sendClaimList (message, res) {
  var chat = message.chat
  var game_id

  if ((game_id = gameExists(chat.id)) === -1) {
    new_game = true
    game_id = createGame(chat.id)
  }

  var claim_message = prepareClaimMessage(gameCharList[game_id].claims)

  try {
    await axios.post(TELEGRAM_API_BASE + process.env.BOT_TOKEN + DELETE_MESSAGE,
      {
        chat_id: chat.id,
        message_id: gameCharList[game_id].message_id
      })
  } catch (err) {
    console.log('Error :', err)
    res.end('Error :' + err)
  }
  
  try {
    var response = await axios.post(TELEGRAM_API_BASE + process.env.BOT_TOKEN + SEND_MESSAGE,
      {
        chat_id: chat.id,
        text: claim_message,
        parse_mode: 'Markdown'
      })
    updateMessageId(game_id, response.data.result.message_id)
  } catch (err) {
    console.log('Error :', err)
    res.end('Error :' + err)
  }

  console.log('Claim sent')
  res.send('ok')
}

async function handleReset(message, res) {
  var game_id
  var chat = message.chat

  if ((game_id = gameExists(chat.id)) === -1) {
    new_game = true
    game_id = createGame(chat.id)
  }

  gameCharList[game_id].claims = []

  try {
    await axios.post(TELEGRAM_API_BASE + process.env.BOT_TOKEN + SEND_MESSAGE,
      {
        chat_id: chat.id,
        reply_to_message_id: message.message_id,
        text: "Reset claims list"
      })
      console.log("Sent reset")
  } catch(err) {
    console.log('Error :', err)
    res.end('Error :' + err)
  }

  res.send('ok')
}

//This is the route the API will call
app.post('/new-message', async function (req, res) {

  const { message } = req.body
  console.log(message)

  if (!message || !message.text) {
    return res.end()
  }

  if (message.text.includes("/claim")) {
    var claim = message.text.replace("/claim", "").trim()

    if (claim === "") {
      sendClaimList(message, res)
    } else {
      handleClaim(message, claim, res)
    }
  } else if (message.text.includes("/reset")) {
    handleReset(message, res)
  } else {
    res.end()
  }
})

// Finally, start our server
app.listen(process.env.PORT_NO, function () {
  console.log('Telegram app listening on port', process.env.PORT_NO, '!')
})
