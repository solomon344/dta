# DTA Certificate Verification System - API Documentation

## Overview
The DTA Certificate Verification System provides two main API endpoints:
1. **Single Certificate Verification** - Look up individual certificates
2. **Batch Certificate Generation** - Generate multiple certificates in various formats

---

## Endpoints

### 1. Single Certificate Verification

**Endpoint:** `GET /api/verify`

**Purpose:** Verify a single student certificate by ID or name

**Parameters:**
- `q` (string, required): Certificate ID (e.g., "DTA2000") or student name (e.g., "Abba Tamba")

**Example Requests:**
```bash
# By Certificate ID
curl "http://localhost:3000/api/verify?q=DTA2000"

# By Student Name
curl "http://localhost:3000/api/verify?q=Abba+Tamba"
```

**Success Response (200):**
```json
{
  "verified": true,
  "student": {
    "id": "DTA2000",
    "name": "Abba Tamba",
    "course": "DATA ANALYTICS",
    "cohort": "Cohort 2",
    "issueDate": "October 20, 2026"
  }
}
```

**Error Responses:**
- `400` - Missing or empty query parameter
- `404` - Certificate not found
- `500` - Server error

---

### 2. Single Certificate Download

**Endpoint:** `GET /api/certificates/download`

**Purpose:** Download a single student certificate in multiple formats

**Parameters:**
- `id` (string, required): Certificate ID (e.g., "DTA2000")
- `format` (string, optional): Output format - `html` (default), `pdf`, or `png`

**Example Requests:**

#### Download as HTML
```bash
curl "http://localhost:3000/api/certificates/download?id=DTA2000&format=html" -o certificate.html
```

#### Download as PDF
```bash
curl "http://localhost:3000/api/certificates/download?id=DTA2000&format=pdf" -o certificate.pdf
```

#### Download as PNG
```bash
curl "http://localhost:3000/api/certificates/download?id=DTA2000&format=png" -o certificate.png
```

**Success Response:**
- **HTML**: Returns standalone HTML file (no external dependencies)
- **PDF**: Returns PDF document (requires puppeteer)
- **PNG**: Returns high-resolution image 2x scale (requires puppeteer)

**Headers:**
```
Content-Disposition: attachment; filename="DTA2000_Certificate_Name_certificate.pdf"
Content-Type: application/pdf (or text/html, image/png)
```

**Error Responses:**
- `400` - Missing certificate ID or invalid format
- `404` - Certificate not found
- `501` - PDF/PNG generation not available (puppeteer not installed)
- `500` - Generation error

---

### 3. Batch Certificate Generation

**Endpoint:** `GET /api/certificates/batch`

**Purpose:** Generate multiple certificates in bulk with various output formats

**Parameters:**
- `format` (string, optional): Output format - `json` (default), `csv`, or `html`
- `course` (string, optional): Filter by course - `all` (default), `SOFTWARE_DEVELOPMENT`, or `DATA_ANALYTICS`
- `limit` (number, optional): Limit the number of certificates returned

**Example Requests:**

#### Get all certificates as JSON
```bash
curl "http://localhost:3000/api/certificates/batch"
```

#### Get all Software Development certificates as CSV
```bash
curl "http://localhost:3000/api/certificates/batch?course=SOFTWARE_DEVELOPMENT&format=csv" > certificates.csv
```

#### Get Data Analytics certificates as HTML
```bash
curl "http://localhost:3000/api/certificates/batch?course=DATA_ANALYTICS&format=html" > certificates.html
```

#### Get first 10 certificates as JSON
```bash
curl "http://localhost:3000/api/certificates/batch?limit=10"
```

#### Get first 5 Software Development certificates as CSV
```bash
curl "http://localhost:3000/api/certificates/batch?course=SOFTWARE_DEVELOPMENT&format=csv&limit=5"
```

---

## Response Formats

### JSON Format

**Success Response:**
```json
{
  "success": true,
  "count": 68,
  "course": "all",
  "certificates": [
    {
      "id": "DTA2000",
      "name": "Abba Tamba",
      "course": "DATA ANALYTICS",
      "cohort": "Cohort 2",
      "issueDate": "October 20, 2026",
      "title": "Data Analytics Fundamentals with Excel, Power BI and Basic Python",
      "detail": "Using Excel, Power BI, statistics and basic Python to analyze real-world data and build dashboards."
    },
    {
      "id": "DTA2064",
      "name": "Baboucarr Ceesay",
      "course": "SOFTWARE DEVELOPMENT",
      "cohort": "Cohort 2",
      "issueDate": "October 20, 2026",
      "title": "Software Development Fundamentals in Web Frontend and APIs",
      "detail": "Including a capstone project demonstrating frontend development proficiency in HTML, CSS and JavaScript with API integration."
    }
    // ... more certificates
  ]
}
```

### CSV Format

**Headers:**
```
Certificate ID,Student Name,Course,Cohort,Issue Date
```

**Sample Row:**
```
DTA2000,Abba Tamba,DATA ANALYTICS,Cohort 2,October 20, 2026
```

**Content-Type:** `text/csv`
**Download Filename:** `certificates.csv`

### HTML Format

**Output:** Responsive HTML page with certificate cards in a grid layout
- Card-based display for easy viewing and printing
- Print-friendly styling
- Color-coded by course type
- Includes summary statistics (total certificates, generation date)

**Content-Type:** `text/html`
**Features:**
- Grid layout (auto-responsive)
- Card hover effects
- Color coding (Software Dev = blue, Data Analytics = green)
- Print optimization

---

## Use Cases

### 1. Export All Certificates for Admin Records
```bash
curl "http://localhost:3000/api/certificates/batch?format=json" | jq . > all_certificates.json
```

### 2. Generate CSV for Spreadsheet Import
```bash
curl "http://localhost:3000/api/certificates/batch?format=csv" > certificates.csv
# Open in Excel, Google Sheets, etc.
```

### 3. Create Printable Certificate List
```bash
curl "http://localhost:3000/api/certificates/batch?format=html" > print_certificates.html
# Open in browser and print to PDF
```

### 4. Get Only Software Development Certificates
```bash
curl "http://localhost:3000/api/certificates/batch?course=SOFTWARE_DEVELOPMENT&format=json"
```

### 5. Generate Sample Batch for Testing
```bash
curl "http://localhost:3000/api/certificates/batch?limit=5&format=html" > sample.html
```

---

## Statistics

### Current Database
- **Total Students:** 68
- **Software Development:** 13
- **Data Analytics:** 55
- **Cohort:** Cohort 2
- **Issue Date:** October 20, 2026

---

## Error Handling

All endpoints return appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request (missing/invalid parameters) |
| 404 | Certificate/Student not found |
| 500 | Server Error |

**Error Response Example:**
```json
{
  "error": "An error occurred while generating certificates"
}
```

---

## Integration Examples

### JavaScript/Node.js
```javascript
// Single certificate lookup
const response = await fetch('/api/verify?q=DTA2000');
const data = await response.json();

// Batch export
const csvResponse = await fetch('/api/certificates/batch?format=csv');
const csv = await csvResponse.text();
```

### Python
```python
import requests

# Single certificate
resp = requests.get('http://localhost:3000/api/verify?q=DTA2000')
print(resp.json())

# Batch as CSV
csv_resp = requests.get('http://localhost:3000/api/certificates/batch?format=csv')
with open('certs.csv', 'w') as f:
    f.write(csv_resp.text)
```

### cURL
```bash
# Verify single certificate
curl "http://localhost:3000/api/verify?q=DTA2000"

# Export all as CSV
curl "http://localhost:3000/api/certificates/batch?format=csv" -o certificates.csv

# Export filtered as HTML
curl "http://localhost:3000/api/certificates/batch?course=SOFTWARE_DEVELOPMENT&format=html" -o soft_dev_certs.html
```

---

## Rate Limiting & Performance

- No rate limiting currently implemented
- All 68 certificates can be retrieved simultaneously
- JSON format: ~50-100KB
- CSV format: ~10-15KB
- HTML format: ~100-150KB

---

## Future Enhancements

- [ ] PDF certificate generation
- [ ] Email delivery integration
- [ ] Database backing (currently in-memory)
- [ ] Authentication/authorization
- [ ] Rate limiting
- [ ] Webhook notifications
- [ ] Bulk import/update via API
- [ ] Certificate signature verification
