# HCIChoreApp

## Team

| Name | Email |
|---|---|
| Wilson Goins | wilson.goins@ufl.edu |
| Tyler Pencinger | tyler.pencinger@ufl.edu |
| Zachary Pinet | pinetz@ufl.edu |

## Getting the App Running on Your Phone

### Step 1 — Download Expo Go on your iPhone

Go to the App Store and search **"Expo Go"**. The app you want is:
- **Name:** Expo Go by Nametag
- **Seller:** 650 Industries, Inc.

---

### Step 2 — Install Node.js on your laptop

Go to **https://nodejs.org** and download the **LTS** version. Run the installer and click through with all the default settings.

---

### Step 3 — Open PowerShell

---

### Step 4 — Clone the repo

Type this exactly and hit Enter:

```powershell
git clone https://github.com/TJPcodes/HCIChoreApp.git
```

Then navigate into the folder:

```powershell
cd HCIChoreApp
```

> If you get an error saying the folder already exists, run this first then try again:
> ```powershell
> Remove-Item -Recurse -Force HCIChoreApp
> ```

---

### Step 5 — Install everything

Run these four commands **one at a time**, waiting for each to finish before running the next:

```powershell
npm install expo@^54
```
```powershell
npm install
```
```powershell
npm install babel-preset-expo
```
```powershell
npx expo install --fix
```

---

### Step 6 — Start the app

```powershell
npx expo start --clear
```

A QR code will appear in your terminal. Leave this window open.

---

### Step 7 — Open on your iPhone

Open the **Expo Go** app on your phone, tap **"Scan QR Code"**, and point your camera at the QR code in the terminal. The app will load on your phone in a few seconds.

If QR code scanning is not working, you may need to have your laptop and iPhone on the same Wi-Fi network, and both may also need to be logged in to the same Expo Go account. You can make one easily in the app, and log in with:

```powershell
npx expo login
```