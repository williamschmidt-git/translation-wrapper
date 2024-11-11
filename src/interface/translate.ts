import * as fs from 'fs';
import * as path from 'path';

function extractTranslationKeys(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const tFunctionRegex = /t\(['"](.*?)['"]\)/g;
        
        const translations = [];
        
        let match;
        while ((match = tFunctionRegex.exec(content)) !== null) {
            translations.push(match[1]);
        }
        
        return translations;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return [];
    }
}

function findTsxFiles(directory) {
    const results = [];
    
    function traverseDir(currentPath) {
        const files = fs.readdirSync(currentPath);
        
        files.forEach(file => {
            const fullPath = path.join(currentPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                traverseDir(fullPath);
            } else if (file.endsWith('.tsx')) {
                results.push(fullPath);
            }
        });
    }
    
    traverseDir(directory);
    return results;
}

function processFilePaths(paths) {
    const allTranslations = new Set();
    const fileResults = {};

    paths.forEach(inputPath => {
        let filesToProcess = [];
        
        if (fs.statSync(inputPath).isDirectory()) {
            filesToProcess = findTsxFiles(inputPath);
        } else if (inputPath.endsWith('.tsx')) {
            filesToProcess = [inputPath];
        } else {
            console.warn(`Skipping ${inputPath} - not a .tsx file or directory`);
            return;
        }
        
        // Process each file
        filesToProcess.forEach(file => {
            const translations = extractTranslationKeys(file);
            if (translations.length > 0) {
                fileResults[file] = translations;
                translations.forEach(t => allTranslations.add(t));
            }
        });
    });

    return {
        allTranslations: [...allTranslations],
        fileResults
    };
}

function main() {
    // Get the file paths from command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Please provide at least one file or directory path.');
        console.error('Usage: npm run translate <path1> [path2] [path3] ...');
        console.error('Each path can be either a .tsx file or a directory');
        process.exit(1);
    }

    try {
        const { allTranslations, fileResults } = processFilePaths(args);
        
        // Display results
        console.log('\n=== Translation Keys Found ===\n');
        
        // Show results per file
        Object.entries(fileResults).forEach(([file, translations]) => {
            console.log(`\nFile: ${file}`);
            console.log('Translations:');
            translations.forEach((key, index) => {
                console.log(`  ${index + 1}. "${key}"`);
            });
        });
        
        // Show summary
        console.log('\n=== Summary ===');
        console.log(`Total unique translations found: ${allTranslations.length}`);
        console.log('\nAll unique translations:');
        allTranslations.forEach((key, index) => {
            console.log(`${index + 1}. "${key}"`);
        });
        
        // Optionally save to a JSON file
        const outputPath = 'translations.json';
        fs.writeFileSync(outputPath, JSON.stringify({
            translations: allTranslations,
            fileMapping: fileResults
        }, null, 2));
        console.log(`\nTranslations saved to ${outputPath}`);
        
    } catch (error) {
        console.error('Error processing files:', error.message);
        process.exit(1);
    }
}

main();