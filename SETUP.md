# DTA Certificate Verification System - Setup Guide

Complete setup and deployment guide for the certificate verification system.

## 🔧 Prerequisites

- Node.js 18+ or later
- npm or yarn
- A modern web browser

## 📦 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Verify Installation

Check that all dependencies are installed:

```bash
npm list
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Free Tier Available)

Vercel is the creator of Next.js and offers seamless deployment.

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub/GitLab/Bitbucket

2. **Deploy Project**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Follow the prompts**
   - Connect your git repository
   - Select project settings
   - Deploy

4. **Your site is live!**
   - Get a unique domain (e.g., dta-verify.vercel.app)
   - Share with students

### Option 2: Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Deploy**
   - Click "Deploy"
   - Get your live URL

### Option 3: Self-Hosted (VPS/Server)

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **Use Process Manager (Recommended)**
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name "dta-verify"
   pm2 save
   ```

4. **Setup Reverse Proxy (Nginx)**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## 📋 Configuration

### Update Certificate Information

Edit `lib/students.ts` to:

1. **Add New Students**
   ```typescript
   const softwareDevelopmentStudents: Student[] = [
     { 
       id: "DTA2069", 
       name: "New Student Name", 
       course: "SOFTWARE DEVELOPMENT", 
       cohort: "Cohort 2", 
       issueDate: "October 20, 2026" 
     },
     // ... more students
   ];
   ```

2. **Update Cohort Information**
   - Change `cohort: "Cohort 2"` to your cohort name
   - Update `issueDate` as needed

3. **Change Academy Details**
   - Update `app/page.tsx` header section
   - Update `components/CertificateCard.tsx` for styling

### Customize Styling

1. **Colors**
   - Edit `app/globals.css` for color schemes
   - Update Tailwind classes in components

2. **Fonts**
   - Modify `app/layout.tsx` to add custom fonts
   - Update CSS in `app/globals.css`

3. **Layout**
   - Adjust spacing in `components/CertificateCard.tsx`
   - Modify responsive breakpoints in components

## 🌐 Domain Setup

### Add Custom Domain

1. **Purchase Domain**
   - GoDaddy, Namecheap, Cloudflare, etc.

2. **Configure DNS**
   - If using Vercel: Point domain to Vercel nameservers
   - If using other hosting: Update CNAME or A records

3. **Enable HTTPS**
   - Automatic with Vercel
   - Use Let's Encrypt for self-hosted

## 🔐 Production Checklist

- [ ] Update student data (`lib/students.ts`)
- [ ] Customize academy name and details
- [ ] Test certificate search thoroughly
- [ ] Optimize images (if any added)
- [ ] Setup monitoring/logging
- [ ] Configure rate limiting on API
- [ ] Enable HTTPS
- [ ] Setup error tracking (e.g., Sentry)
- [ ] Test on mobile devices
- [ ] Setup analytics
- [ ] Document support contact info
- [ ] Backup student data regularly

## 📊 Monitoring & Maintenance

### View Logs

**Vercel:**
```bash
vercel logs
```

**Self-hosted with PM2:**
```bash
pm2 logs dta-verify
```

### Performance Monitoring

1. **Vercel Analytics**
   - Automatic with Vercel deployment
   - Visit project dashboard

2. **Sentry (Error Tracking)**
   ```bash
   npm install @sentry/nextjs
   ```

3. **Google Analytics**
   - Add script to `app/layout.tsx`

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Certificate Not Found in Production

- Verify `lib/students.ts` is included in build
- Check API endpoint works: `/api/verify?q=DTA2000`
- Ensure data is properly formatted

## 📞 Support

For issues:
1. Check the main [README.md](README.md)
2. Verify all dependencies installed (`npm list`)
3. Check [Next.js Documentation](https://nextjs.org/docs)
4. Contact support at admin@dta.gm

## 🔄 Updates & Maintenance

### Add New Students

1. Edit `lib/students.ts`
2. Add student object to appropriate array
3. Redeploy application

### Update System

```bash
npm update
npm run build
npm start
```

## 📱 Mobile Testing

Test on actual devices or use browser DevTools:

1. Chrome: Press F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Test on different screen sizes
3. Test touch interactions
4. Test on slow networks (DevTools → Throttle)

---

**Last Updated:** October 20, 2026
**Version:** 1.0.0