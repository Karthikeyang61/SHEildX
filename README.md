<<<<<<< HEAD
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e4a0ae15-11b6-4c2b-aa6a-545b346714ee

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e4a0ae15-11b6-4c2b-aa6a-545b346714ee) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Web Bluetooth API (for ESP32 communication)

## ESP32 Integration

This application connects to real ESP32 devices via Web Bluetooth to perform SOS alerts and GSM operations.

### Browser Requirements

- **Chrome** (recommended)
- **Edge** (Chromium-based)
- **Opera**

Web Bluetooth requires HTTPS or localhost. The app will show a warning if Web Bluetooth is not supported.

### ESP32 Setup

See [ESP32_FIRMWARE_GUIDE.md](./ESP32_FIRMWARE_GUIDE.md) for complete firmware setup instructions.

**Quick Start:**
1. Flash ESP32 with firmware implementing the BLE service (UUID: `0000ff00-0000-1000-8000-00805f9b34fb`)
2. Ensure ESP32 is advertising with name containing "SHEild" or "ESP32"
3. Connect GSM module (SIM800L/SIM900) for SMS functionality
4. Open the web app and scan for devices

### Features

- **Real Bluetooth Connection**: Connect to ESP32 devices via Web Bluetooth
- **SOS Alerts**: Trigger emergency alerts that send SMS via ESP32's GSM module
- **Police Alerts**: Immediate emergency service notifications
- **Device Status**: Real-time battery, GSM, and LED status from ESP32
- **Emergency Contact Management**: Update contact numbers on the ESP32 device

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e4a0ae15-11b6-4c2b-aa6a-545b346714ee) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
=======
# SHEildX
Women Safety Device 
>>>>>>> 7f36e138e4b81dda8a5e53eb7f4da34cd07ae091
