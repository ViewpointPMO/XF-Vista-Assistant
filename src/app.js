import fs from 'fs';
import scrapeFaq from './faq-scraper.js';
import scrapeCases from './sf-scraper.js';
import scrapeKbs from './knowledge-scraper.js';
import path from 'path';
import config from 'config';

export async function main() {
    let timeStamp = Date.now();
    let outputDir = config.get('outputDir');
    if(!outputDir || !fs.existsSync(outputDir)) {
        throw 'Output directory does not exist.'
    }

    if(config.get('scrape.faq')) {
        let faqMDRecords = await scrapeFaq();
        for (let i = 0; i < faqMDRecords.length; i++) {
            fs.writeFileSync(path.join(outputDir,`FAQ-${i}.md`), faqMDRecords[i]);
        }
    }
    
    if(config.get('scrape.cases')) {
        let caseMDRecords = await scrapeCases();
        for (let i = 0; i < caseMDRecords.length; i++) {
            let fileName = `SF-${i}-${timeStamp}.md`;
            let filePath = path.join(outputDir,fileName);
            fs.writeFileSync(filePath, caseMDRecords[i]);
        }
    }

    if(config.get('scrape.knowledge')) {
        let kbMDRecords = await scrapeKbs();
        for (let i = 0; i < kbMDRecords.length; i++) {
            let fileName = `KB-${i}-${timeStamp}.md`;
            let filePath = path.join(outputDir,fileName);
            fs.writeFileSync(filePath, kbMDRecords[i]);
        }
    }
}

