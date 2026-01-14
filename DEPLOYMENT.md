# Deployment Guide: Global Clicker

This guide will walk you through deploying your Global Clicker prototype permanently using **Vercel** (for hosting) and **Supabase** (for the database).

## Prerequisites
1. A [GitHub](https://github.com/) account.
2. A [Supabase](https://supabase.com/) account.
3. A [Vercel](https://vercel.com/) account.

---

## Step 1: Prepare Your Database (Supabase)

1. **Create a New Project**: Log in to Supabase and create a new project named `global-clicker`.
2. **Get Connection String**:
   - Go to **Project Settings** > **Database**.
   - Copy the **Connection string** (URI). It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres`.
   - **Important**: Replace `[YOUR-PASSWORD]` with the password you set when creating the project.
3. **Initialize Tables**:
   - Go to the **SQL Editor** in Supabase.
   - Paste and run the content of the `drizzle/0000_talented_amphibian.sql` file from your project to create the necessary tables.

---

## Step 2: Push Code to GitHub

1. Create a new **private** repository on GitHub named `global-clicker`.
2. Upload the files from the `global-clicker-prototype-final.zip` to this repository.
   - *Note: Do not upload `node_modules` or `.env` files.*

---

## Step 3: Deploy to Vercel

1. **Import Project**:
   - Log in to Vercel and click **Add New** > **Project**.
   - Import your `global-clicker` repository from GitHub.
2. **Configure Environment Variables**:
   - During the "Configure Project" step, expand the **Environment Variables** section.
   - Add the following:
     - `DATABASE_URL`: (The Supabase connection string from Step 1)
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: (Generate a random string, e.g., `your-secret-key-123`)
3. **Deploy**: Click **Deploy**. Vercel will build and host your site.

---

## Step 4: Connect Your Domain (Optional)

1. In Vercel, go to your project **Settings** > **Domains**.
2. Enter the domain you bought (e.g., `myclicker.com`).
3. Follow the instructions to update your domain's DNS records (A and CNAME) at your domain registrar.

---

## Maintenance & Anti-Cheat
- The backend is already configured with a rate limit of **10 clicks per second**.
- To adjust this, edit `server/routers/clicker.ts`.
- Your Supabase free tier will handle millions of clicks, but keep an eye on the "Database Size" in the Supabase dashboard if you go viral!
