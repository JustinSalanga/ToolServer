# Bid Check - JavaScript Version

This is a JavaScript conversion of the Python `bid_check.py` script for processing Excel files and detecting duplicate job URLs and resumes.

## Features

- **URL Normalization**: Handles redirect URLs from Indeed, Wiraa, and other job sites
- **Duplicate Detection**: Finds duplicate job URLs and resumes in Excel files
- **Excel Processing**: Reads and writes Excel files with duplicate highlighting
- **Resume Statistics**: Tracks resume usage frequency
- **URL Cleaning**: Removes unnecessary query parameters and suffixes

## Installation

1. Install Node.js dependencies:
```bash
npm install xlsx
```

Or copy the dependencies from `package-bid-check.json`:
```bash
npm install xlsx@^0.18.5
```

## Usage

### Command Line
```bash
node bid_check.js [filepath]
```

Example:
```bash
node bid_check.js bid.xlsx
```

### As a Module
```javascript
const { processBidFile, checkUrlDuplicates } = require('./bid_check.js');

// Process Excel file
const result = processBidFile('bid.xlsx');
console.log(`Found ${result.duplicateCount} duplicates`);

// Check for URL duplicates
checkUrlDuplicates('bid.xlsx');
```

## Input File Format

The script expects an Excel file with the following columns:
- `NO`: Row number/ID
- `LINK`: Job URL
- `COMPANY NAME`: Company name
- `JOB TITLE`: Job title
- `RESUME`: Resume identifier

## Output

- **Console Output**: Lists duplicate entries with their details
- **Excel File**: Creates `bid_processed.xlsx` with processed data
- **Summary**: Shows total rows, duplicate count, and top resume usage

## URL Processing

The script handles various URL formats:

### Redirect URLs
- **Indeed**: Extracts job key from `jk` parameter
- **Wiraa**: Extracts target URL from `source` parameter

### URL Cleaning
- Removes query parameters (except for Indeed, BuiltIn, Wellfound, Wiraa)
- Removes trailing slashes
- Removes `/apply` and `/application` suffixes
- Normalizes domain names (removes `www.`)

### Example Transformations
```
Input:  https://example.com/job/123?utm_source=google&ref=linkedin
Output: https://example.com/job/123

Input:  https://www.indeed.com/viewjob?jk=abc123&from=search
Output: https://www.indeed.com/viewjob?jk=abc123
```

## Functions

### `processBidFile(filePath)`
Main function that processes the Excel file and detects duplicates.

**Parameters:**
- `filePath` (string): Path to the Excel file

**Returns:**
- Object with processing results and statistics

### `checkUrlDuplicates(filePath)`
Checks for duplicate URLs between all entries in the file.

### `extractTargetUrl(url)`
Extracts the target URL from redirect URLs.

### `normalizeFinalUrl(url)`
Normalizes URLs by removing www, trailing slashes, and sorting query parameters.

### `areJobUrlsSame(url1, url2)`
Compares two URLs to determine if they point to the same job.

### `clearLink(link)`
Cleans and normalizes job URLs.

## Error Handling

The script includes error handling for:
- Missing files
- Invalid Excel formats
- Malformed URLs
- Missing required columns

## Differences from Python Version

1. **Excel Processing**: Uses `xlsx` library instead of `pandas` and `openpyxl`
2. **Styling**: Limited styling support (metadata only, manual Excel formatting needed)
3. **Performance**: May be slower for very large files due to JavaScript limitations
4. **Dependencies**: Requires Node.js and npm packages

## Requirements

- Node.js 12+ 
- Excel file with required columns
- `xlsx` npm package

## Example Output

```
Processing 150 rows...

123 Company A    Software Engineer
124 Company B    Frontend Developer
125 Company A    Software Engineer

Duplicated IDs: ['123', '124', '125']

Found 3 duplicate entries

Processed file saved as: bid_processed.xlsx

=== SUMMARY ===
Total rows: 150
Duplicate entries: 3
Output file: bid_processed.xlsx

Top resumes by usage:
resume_v1.pdf: 15 times
resume_v2.pdf: 12 times
resume_v3.pdf: 8 times
```
