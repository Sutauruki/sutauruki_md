# 🤖 Sutauruki-MD: The Ultimate WhatsApp Bot

Welcome to **Sutauruki-MD**! This isn't just another bot; it's your personal assistant, group manager, and AI companion, all rolled into one sleek package. 🚀

## ✨ Cool Features

Why should you use Sutauruki-MD? Here's why:

*   **📱 QR Interface**: No more terminal scrambling! View your connection status and scan the QR code directly from a beautiful web interface.
*   **📧 Smart Login**: Get your login QR code sent straight to your email. Login from anywhere, anytime.
*   **🧠 Supercharged AI**: Powered by **Groq**, get lightning-fast AI responses and even audio transcriptions. It's like having a genius in your chat.
*   **🛡️ Group Guardian**: Keep your groups clean with the **Anti-Link** feature. It warns and removes spammers automatically.
*   **🔌 Modular Plugins**: Easily extend functionality with a robust plugin system.
*   **📥 Media Tools**: Download and manage media with ease.

## 🚀 Getting Started

Follow these simple steps to get your bot up and running in no time!

### Prerequisites

*   **Node.js**: Make sure you have Node.js installed on your machine.
*   **pnpm**: We use `pnpm` for fast and efficient package management.

### 🛠️ Installation

1.  **Clone the Repository**
    ```bash
    git clone <your-repo-url>
    cd sutauruki-md
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    ```

### ⚙️ Configuration

This is the most important part! You need to tell the bot your secrets (shhh 🤫).

1.  **Create your `.env` file**
    Copy the example file to get started:
    ```bash
    cp .env.example .env
    ```

2.  **Fill in the details**
    Open the `.env` file and fill in the following:

    *   **USERMAIL**: Your Gmail address (e.g., `cool.dev@gmail.com`). This is where the QR code will be sent.
    *   **USERPASS**: Your Gmail **App Password**.
        *   *How to get it?* Go to your Google Account > Security > 2-Step Verification > App Passwords. Generate one and paste it here. **Do not use your real password!**
    *   **PHONE_NUMBER**: Your phone number in international format without `+` (e.g., `2348012345678`).
    *   **BUSINESS_NUMBER**: (Optional) Another number if you have a business account.
    *   **OWNER_PICTURE**: URL to the owner's profile picture.
    *   **GROQ_API_KEY**: Your API key from Groq.
        *   *Get it here:* [Groq Console](https://console.groq.com/keys)
    *   **CLOUDINARY_CLOUD_NAME**: Your Cloudinary Cloud Name.
    *   **CLOUDINARY_API_KEY**: Your Cloudinary API Key.
    *   **CLOUDINARY_API_SECRET**: Your Cloudinary API Secret.
        *   *Get them here:* [Cloudinary Dashboard](https://cloudinary.com/console)

### 🏃‍♂️ Running the Bot

Time to lift off! 🛸

*   **Development Mode** (Best for testing)
    ```bash
    pnpm run dev
    ```

*   **Production Mode** (For serious business)
    ```bash
    pnpm run build
    pnpm start
    ```

Once running, open your browser and go to `http://localhost:5000` to see the magic happen! ✨

## 🤝 Contributing

Got a cool idea? Found a bug? Feel free to open an issue or submit a pull request. Let's make this bot even better together!

---

*Made with ❤️ by Sutauruki*
