Discord bot, to delete Duplicate messages of all text channels in a given Category.
I created that for personal use so it has hardcoded IDs in main.js but is a good startingpoint if you need something similar.

### Features

- DMs User if a post gets deleted
- Caches messages locally to avoid to many requests to discord api
- auto.Loads last 200 messages of each textchat in local cache on startup

# Installation

Create an Application on https://discord.com/developers/applications
Create an Oauth2 Link, open it and Join the Server
Grant Administration Rights to the Bot on the server and on the Website

Generate a Token and add it to .env.example
rename .env.example to .env

Replace categoryID value in main.js with the categoryID of your Discord Server category

Install / Use bun (https://bun.sh) to execute the bot with bun run main.js
