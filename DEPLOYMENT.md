# Deploying Tambola Pro Backend 🚀

This guide is for absolute beginners to deploy the Tambola Pro Backend Server to the internet for free using Render.

## 📝 Prerequisites
Before deploying the backend, you need a few accounts:
1. **GitHub Account**: Sign up at [GitHub.com](https://github.com/) to store your code.
2. **Clerk Account**: Sign up at [Clerk.com](https://clerk.com/) and create an application to secure your game. Save your **Secret Key**.
3. **MongoDB Database**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) to get a free database and copy your connection string (URI).
4. **Render Account**: Sign up at [Render.com](https://render.com/) using your new GitHub Account.

## 📥 Step 1: Fork the Repository
First, make your own copy of the official backend code.
1. Make sure you are logged into GitHub.
2. Go to the official repository link: [https://github.com/DRLVP/tambola-pro.git](https://github.com/DRLVP/tambola-pro.git)
3. In the top-right corner, click the **Fork** button (looks like a split arrow) and click **Create fork**.

## 🚀 Step 2: Deploy to Render
The backend needs a server to run on 24/7. Render will do this for us.
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository**.
4. Connect to your GitHub and select your newly forked `tambola-pro` repository.
5. Name your web service (e.g., `tambola-backend`).

## 🔐 Step 3: Configure Environment Variables (.env)
Render needs to know your secret keys to run the backend correctly.
1. Scroll down to the **Environment Variables** section on the Render setup page.
2. Click **Add Environment Variable** and add these exactly:
   * **Key**: `PORT`
     **Value**: `8080`
   * **Key**: `MONGODB_URI`
     **Value**: *(Paste your MongoDB connection string here)*
   * **Key**: `CLERK_SECRET_KEY`
     **Value**: *(Paste your Clerk Secret Key here)*
   * **Key**: `CLIENT_URL`
     **Value**: `*` *(This allows anyone to play. You can change this to your Netlify URL later)*
3. Scroll down and click **Deploy Web Service**.
4. Wait a few minutes. When the status turns green and says **"Live"**, your server is running!
5. **Copy the URL provided by Render** (e.g., `https://tambola-backend-abc.onrender.com`). You will need this to deploy the Admin and User websites.
