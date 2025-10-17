const XLSX = require('xlsx');
const fs = require('fs');

// URL parsing and normalization functions
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

function areJobUrlsSame(url1, url2) {
    const u1 = normalizeFinalUrl(extractTargetUrl(url1));
    const u2 = normalizeFinalUrl(extractTargetUrl(url2));
    return u1 === u2;
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

// Main function to process the Excel file
function processBidFile(filePath = 'bid.xlsx') {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`Processing ${data.length} rows...`);
        
        const linkList = {};
        const resumeCntDict = {};
        const duplicatedIds = [];
        const allLinks = [];
        
        // Process each row
        data.forEach((row, index) => {
            // Collect all links
            if (row.LINK) {
                allLinks.push([String(row.NO), String(row.LINK)]);
            }
            
            // Process resume counting
            if (row.RESUME) {
                let resume = String(row.RESUME).replace(/\s/g, '');
                if (!resumeCntDict[resume]) {
                    resumeCntDict[resume] = 1;
                } else {
                    resumeCntDict[resume]++;
                }
            }
            
            // Process link deduplication
            if (row.LINK) {
                const dIndex = clearLink(row.LINK);
                if (!linkList[dIndex]) {
                    linkList[dIndex] = [row.NO];
                } else {
                    linkList[dIndex].push(row.NO);
                    console.log(`${row.NO} ${row['COMPANY NAME']}\t\t${row['JOB TITLE']}`);
                    duplicatedIds.push(String(row.NO));
                }
            }
        });
        
        // Sort resume list by count
        const resumeList = Object.entries(resumeCntDict)
            .map(([resume, count]) => [resume, count])
            .sort((a, b) => b[1] - a[1]);
        
        console.log('\nDuplicated IDs:', duplicatedIds);
        console.log(`\nFound ${duplicatedIds.length} duplicate entries`);
        
        // Create output Excel file with highlighting
        const outputWorkbook = XLSX.utils.book_new();
        const outputWorksheet = XLSX.utils.json_to_sheet(data);
        
        // Add styling information (XLSX doesn't support direct styling, but we can add metadata)
        const styledData = data.map(row => ({
            ...row,
            _isDuplicate: duplicatedIds.includes(String(row.NO))
        }));
        
        const styledWorksheet = XLSX.utils.json_to_sheet(styledData);
        XLSX.utils.book_append_sheet(outputWorkbook, styledWorksheet, 'Main');
        
        // Save the output file
        const outputPath = 'bid_processed.xlsx';
        XLSX.writeFile(outputWorkbook, outputPath);
        
        console.log(`\nProcessed file saved as: ${outputPath}`);
        console.log('Note: For visual highlighting, you may need to manually apply formatting in Excel');
        
        // Return summary
        return {
            totalRows: data.length,
            duplicatedIds: duplicatedIds,
            duplicateCount: duplicatedIds.length,
            resumeStats: resumeList.slice(0, 10), // Top 10 most used resumes
            outputFile: outputPath
        };
        
    } catch (error) {
        console.error('Error processing file:', error.message);
        throw error;
    }
}

// Function to check for duplicate URLs between two specific entries
function checkUrlDuplicates(filePath = 'bid.xlsx') {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Checking for URL duplicates...\n');
        
        for (let i = 0; i < data.length; i++) {
            for (let k = i + 1; k < data.length; k++) {
                const url1 = data[i].LINK;
                const url2 = data[k].LINK;
                
                if (url1 && url2 && areJobUrlsSame(url1, url2)) {
                    console.log(`${data[i].NO} ${data[k].NO} ${url1} ${url2}`);
                    console.log('------------');
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking URL duplicates:', error.message);
        throw error;
    }
}

// Export functions for use in other modules
module.exports = {
    processBidFile,
    checkUrlDuplicates,
    extractTargetUrl,
    normalizeFinalUrl,
    areJobUrlsSame,
    clearLink
};

// If running directly from command line
if (require.main === module) {
    const args = process.argv.slice(2);
    const filePath = args[0] || 'bid.xlsx';
    
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        console.log('Usage: node bid_check.js [filepath]');
        process.exit(1);
    }
    
    console.log(`Processing file: ${filePath}`);
    const result = processBidFile(filePath);
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total rows: ${result.totalRows}`);
    console.log(`Duplicate entries: ${result.duplicateCount}`);
    console.log(`Output file: ${result.outputFile}`);
    
    if (result.resumeStats.length > 0) {
        console.log('\nTop resumes by usage:');
        result.resumeStats.forEach(([resume, count]) => {
            console.log(`${resume}: ${count} times`);
        });
    }
}
