# WhatsApp-Discord Bot

This project bridges WhatsApp and Discord, creating a channel in Discord for each WhatsApp chat and relaying messages between the two platforms.

## Features

- Relays messages from WhatsApp to Discord and vice versa.
- Creates a new channel for each WhatsApp chat based on the chat ID.
- Displays messages sent by you differently for clarity.
- Automatically sets up the Discord server with the necessary structure.

## Prerequisites

- Node.js (https://nodejs.org/)
- Python (https://www.python.org/)
- pip (https://pip.pypa.io/en/stable/)
- npm (https://www.npmjs.com/)
- Git (https://git-scm.com/)

## Installation

1. **Clone the repository**:

    ```sh
    git clone https://github.com/michimimi/whatsappbuddy.git
    cd whatsappbuddy
    ```

2. **Install Node.js dependencies**:

    ```sh
    npm install
    ```

3. **Install Python dependencies**:

    ```sh
    pip install Flask
    ```

## Configuration

1. **Create a Discord bot**:

    - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
    - Create a new application and add a bot to it.
    - Copy the bot token and client ID.

2. **Run the setup script**:

    ```sh
    python setup.py
    ```

    Follow the prompts to enter your Discord Client ID, Bot Token, and Embed Message ID.

    The script will:
    - Open a web page to authorize the bot in your server.
    - Create the necessary channels and categories in your Discord server.


### Project Structure

- `setup_bot.py`: Python script to guide the user through the initial setup.
- `setup_discord.js`: Node.js script to handle the Discord bot functionality and server setup.
- `config_template.json`: Template configuration file used to generate the final `config.json`.
- `config.json`: Generated configuration file with user inputs and dynamic data.
