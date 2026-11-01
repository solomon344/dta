# 🚀 Quick Start Guide - DTA Certificate Verification

Get the certificate verification system up and running in 5 minutes!

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Start Development Server (30 seconds)

```bash
npm run dev
```

## Step 3: Open in Browser (30 seconds)

Visit **[http://localhost:3000](http://localhost:3000)**

You should see the DTA Certificate Verification homepage!

## Step 4: Test It Out! (1-2 minutes)

Try searching for:

### Certificate ID
- **DTA2000** (Abba Tamba - Data Analytics)
- **DTA2064** (Baboucarr Ceesay - Software Development)

### Student Name
- **Abba Tamba**
- **Baboucarr Ceesay**
- **Hawa Khan**

## ✨ You're Done!

The system is now running locally and ready to use!

---

## 📋 What's Next?

### To Deploy (Make it Live Online)

**Option A: Free Vercel Deployment (Easiest)**
```bash
npm install -g vercel
vercel
```
Then follow the prompts. Your site will be live in minutes!

**Option B: Other Hosting**
See `SETUP.md` for Netlify, GitHub Pages, or self-hosted options.

### To Customize

1. **Edit student data:**
   - File: `lib/students.ts`
   - Add/remove students as needed

2. **Change colors/styling:**
   - File: `components/CertificateCard.tsx`
   - File: `app/globals.css`

3. **Update academy info:**
   - File: `app/page.tsx`
   - Change "Data Technology Academy" to your academy name

---

## 🆘 Troubleshooting

### "Port 3000 already in use"
```bash
PORT=3001 npm run dev
```
Then visit http://localhost:3001

### "Certificate not found" when searching
- Make sure you're searching with the exact name or certificate ID
- Check that the name/ID exists in `lib/students.ts`
- Sample IDs: DTA2000, DTA2001, DTA2064, etc.

### "npm install failed"
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📞 Support

- **Main docs:** See `README.md`
- **Setup guide:** See `SETUP.md`
- **Academy email:** admin@dta.gm

---

**Happy verifying! 🎓**