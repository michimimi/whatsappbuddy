import json
import subprocess
import webbrowser
from flask import Flask, request

app = Flask(__name__)

CLIENT_ID = None
DISCORD_BOT_TOKEN = None
GUILD_ID = None

# Read configuration template
with open('config_template.json', 'r') as config_file:
    config_template = json.load(config_file)

def get_input(prompt):
    user_input = input(prompt)
    return user_input.strip()

@app.route('/')
def home():
    auth_url = f"https://discord.com/oauth2/authorize?client_id={CLIENT_ID}&permissions=8&scope=bot"
    return f'''
        <h1>Click <a href="{auth_url}" target="_blank">here</a> to authorize the bot in your server.</h1>
        <form action="/confirm" method="get">
            <button type="submit">I have added the bot</button>
        </form>
    '''

@app.route('/confirm')
def confirm():
    return '''
        <h1>Bot successfully added to the server. Please go back to the console to continue the setup.</h1>
        <script>
            window.location.href = "/close";
        </script>
    '''

@app.route('/close')
def close():
    # This endpoint will be called to indicate the user has confirmed adding the bot
    # Close the Flask server
    shutdown = request.environ.get('werkzeug.server.shutdown')
    if shutdown:
        shutdown()
    return "Server shutting down..."

def main():
    global CLIENT_ID, DISCORD_BOT_TOKEN, GUILD_ID

    print("Welcome to the WhatsApp-Discord Bot Setup")
    
    CLIENT_ID = get_input("Enter your Discord Client ID: ")
    DISCORD_BOT_TOKEN = get_input("Enter your Discord Bot Token: ")

    print("Please create a new server in Discord if you haven't already.")
    input("Press Enter after you have created the server...")

    GUILD_ID = get_input("Enter the Server ID: ")

    webbrowser.open('http://127.0.0.1:5000')
    app.run(port=5000)

    config = config_template.copy()
    config['DISCORD_BOT_TOKEN'] = DISCORD_BOT_TOKEN
    config['GUILD_ID'] = GUILD_ID

    with open('config.json', 'w') as config_file:
        json.dump(config, config_file, indent=4)

    # Run the Node.js script to set up the Discord server
    try:
        result = subprocess.run(["node", "setup_discord.cjs"], check=True, text=True)
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print("Error running setup_discord.cjs:", e)

    print("Setup complete. You can now run your bot.")

if __name__ == "__main__":
    main()
