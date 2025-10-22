const XLSX = require('xlsx');
const fs = require('fs');

// URL normalization functions from model.js
function extractTargetUrl(url) {
    const urlObj = new URL(url);

    // Handle known redirect patterns
    const redirectDomains = {
        'www.indeed.com': 'jk',
        'www.wiraa.com': 'source'
    };

    if (redirectDomains[urlObj.hostname]) {
        const targetParam = redirectDomains[urlObj.hostname];
        const params = new URLSearchParams(urlObj.search);

        // For Indeed, you might not get the full job URL, just job key
        if (redirectDomains[urlObj.hostname] === 'jk' && params.has('jk')) {
            return `https://${urlObj.hostname}/viewjob?jk=${params.get('jk')}`;
        }

        if (params.has(targetParam)) {
            // Decode the redirect target
            return decodeURIComponent(params.get(targetParam));
        }
    }

    // If not a known redirector, return the original with normalized query
    return normalizeQuery(url);
}

function normalizeQuery(url) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    // Sort query parameters
    const sortedParams = new URLSearchParams();
    const sortedKeys = Array.from(params.keys()).sort();

    for (const key of sortedKeys) {
        sortedParams.append(key, params.get(key));
    }

    urlObj.search = sortedParams.toString();
    return urlObj.toString();
}

function normalizeFinalUrl(url) {
    const urlObj = new URL(url);

    // Remove www. prefix and convert to lowercase
    let hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    let pathname = urlObj.pathname.replace(/\/$/, ''); // Remove trailing slash

    // Normalize query parameters
    const params = new URLSearchParams(urlObj.search);
    const sortedParams = new URLSearchParams();
    const sortedKeys = Array.from(params.keys()).sort();

    for (const key of sortedKeys) {
        sortedParams.append(key, params.get(key));
    }

    return `${urlObj.protocol}//${hostname}${pathname}?${sortedParams.toString()}`;
}

function clearLink(link) {
    link = String(link);

    // Remove query parameters for certain domains
    if (link.includes('?') &&
        !link.includes('indeed') &&
        !link.includes('builtin') &&
        !link.includes('wellfound') &&
        !link.includes('wiraa')) {
        link = link.split('?')[0];
    }

    // Remove trailing slash
    if (link.endsWith('/')) {
        link = link.slice(0, -1);
    }

    // Remove /apply suffix
    if (link.endsWith('/apply')) {
        link = link.slice(0, -6);
    }

    // Remove /application suffix
    if (link.endsWith('/application')) {
        link = link.slice(0, -12);
    }

    // Handle Indeed URLs
    if (link.includes('www.indeed.com')) {
        link = extractTargetUrl(link);
    }

    return link;
}

// Function to normalize URL using bid_check.js logic
function normalizeUrl(url) {
    try {
        // First clear the link using bid_check logic
        const clearedUrl = clearLink(url);
        // Then normalize the final URL
        return normalizeFinalUrl(clearedUrl);
    } catch (error) {
        // If URL is invalid, return as is
        return url;
    }
}

// Function to escape SQL strings
function escapeSqlString(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

// Function to format timestamp for SQL
function formatTimestamp(date) {
    if (!date) return 'NULL';
    return date;
}

// Function to convert Excel serial dates to proper timestamps
function convertExcelDate(excelDate) {
    if (!excelDate) return null;
    // Excel serial date: days since 1900-01-01 (with leap year bug)
    const excelEpoch = new Date(1900, 0, 1);
    const days = excelDate - 2; // Subtract 2 to account for Excel's leap year bug
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return date;
}

async function generateSqlFromBid(filePath = 'bid.xlsx', outputPath = 'bid_jobs.sql') {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Processing ${data.length} rows from ${filePath}...`);

        // Create SQL header
        let sqlContent = `/*
 Navicat Premium Dump SQL

 Source Server         : localhost_5432
 Source Server Type    : PostgreSQL
 Source Server Version : 170005 (170005)
 Source Host           : localhost:5432
 Source Catalog        : resume_auth
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170005 (170005)
 File Encoding         : 65001

 Date: ${new Date().toISOString().replace('T', ' ').replace('Z', '')}
*/


-- ----------------------------
-- Table structure for jobs
-- ----------------------------
DROP TABLE IF EXISTS "public"."jobs";
CREATE TABLE "public"."jobs" (
  "id" int4 NOT NULL GENERATED ALWAYS AS IDENTITY (
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1
),
  "title" varchar(200) COLLATE "pg_catalog"."default" NOT NULL,
  "company" varchar(200) COLLATE "pg_catalog"."default",
  "tech" varchar(500) COLLATE "pg_catalog"."default",
  "url" text COLLATE "pg_catalog"."default",
  "normalized_url" text COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of jobs
-- ----------------------------\n`;

        const results = {
            totalRows: data.length,
            processed: 0,
            errors: []
        };

        // Process each row
        for (const row of data) {
            try {
                // Map Excel columns to database fields
                const jobId = row.id ? parseInt(row.id) : null;
                const title = row.title || null;
                const company = row.company || null;
                const tech = row.tech || null;
                const url = row.url || null;
                const description = row.description || null;
                
                // Convert Excel serial dates to proper timestamps
                const created_at = '2025-10-18 00:00:00';
                const updated_at = '2025-10-18 00:00:00';

                // Normalize URL
                const normalizedUrl = url ? normalizeUrl(url) : null;

                // Generate SQL INSERT statement
                const insertStatement = `INSERT INTO "public"."jobs" OVERRIDING SYSTEM VALUE VALUES (${jobId || 'DEFAULT'}, ${escapeSqlString(title)}, ${escapeSqlString(company)}, ${escapeSqlString(tech)}, ${escapeSqlString(url)}, ${escapeSqlString(normalizedUrl)}, ${escapeSqlString(description)}, '${formatTimestamp(created_at)}', '${formatTimestamp(updated_at)}');\n`;
                
                sqlContent += insertStatement;
                results.processed++;
                
                if (results.processed % 100 === 0) {
                    console.log(`Processed ${results.processed} rows...`);
                }

            } catch (error) {
                results.errors.push({
                    row: row.id || 'unknown',
                    error: error.message
                });
                console.error(`Error processing row ${row.id}:`, error.message);
            }
        }

        // Write SQL file
        fs.writeFileSync(outputPath, sqlContent);

        console.log(`\nSQL generation completed:`);
        console.log(`- Total rows processed: ${results.totalRows}`);
        console.log(`- Successfully processed: ${results.processed}`);
        console.log(`- Errors: ${results.errors.length}`);
        console.log(`- Output file: ${outputPath}`);

        if (results.errors.length > 0) {
            console.log('\nErrors encountered:');
            results.errors.forEach(err => {
                console.log(`  Row ${err.row}: ${err.error}`);
            });
        }

        return results;

    } catch (error) {
        console.error('Error generating SQL from bid data:', error.message);
        throw error;
    }
}

// Run the script if called directly
if (require.main === module) {
    generateSqlFromBid()
        .then(results => {
            console.log('SQL generation completed successfully!');
        })
        .catch(error => {
            console.error('Failed to generate SQL:', error);
            process.exit(1);
        });
}

module.exports = { generateSqlFromBid };
