# WolfClaimBot

This is a bot for the Telegram app to claim roles in the game of [WereWolf](https://www.tgwerewolf.com/) made for Telegram.
Add the bot [@wolfclaim_bot](https://telegram.me/wolfclaim_bot) to your group to start using it or [setup this bot in your own server](https://github.com/surajk16/WolfClaimBot/new/master?readme=1#setup-in-your-own-server)

## Usage

1. Claim a role
```
/claim <role_name>
```

2. See all claims
```
/claim
```

3. Reset all claims
```
/reset
```

## Setup in your own server

### Prerequisites
- A server of your own with a domain name/public IP address
- Node.js amd NPM
- Process Manager like PM2

1. Create a new bot in Telegram using [@BotFather](https://telegram.me/BotFather) and make not of the API TOKEN.

2. Clone the project in your server
```
git clone https://github.com/surajk16/WolfClaimBot
```

3. Install dependencies
```
npm install
```

4. Create .env file and fill in the values
```
cp .env.example .env
```
Get the API TOKEN of your bot from Telegram and fill it in BOT_TOKEN.
Fill the port number in which you want to run the app in PORT_NO.

5. Start the app
```
node index.js
``` 

Alternatively you can manage the process of the app using PM2
```
pm2 start index.js --name wolfclaimbot
```

Now the app will run in the specified port in the server

6. ProxyPass this port to a subdomain or subdirectory.
 For example if you are using Apache,
 ```
 ProxyPass /<subdirectory_name>/ http://localhost:PORT_NO/
 ProxyPassReverse /<subdirectory_name>/ http://localhost:PORT_NO/
 ```
 
7. Finally, tell telegram to send messages where your bot is present to your server using a webhook
 ```
 curl -F "url=https://yourdomain.com/<subdirectory_name>/new-message"  https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
 ```
