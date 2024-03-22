import TurndownService from 'turndown';
import config from 'config';

const baseUrl = config.get('salesforce.baseUrl');
const token = config.get('salesforce.token');


export default async function scrapeKnowledge() {
    let kbs = await getKbs();
    return await convertToMarkdown(kbs);
}

async function convertToMarkdown(kbs) {
    let kbMarkdown = [];
    let turndownService = new TurndownService();
    for (const kb of kbs) {
        let mdContent = `## Keywords \nVista, Transformation, XF, Viewpoint, Cloud, ${kb.Taxonomy_Path__c}  \n\n`
                + `## Source \nSalesforce Knowledge Article: ${kb.ArticleNumber}\n\n`
                + `# Subject \n${kb.Title || ""} \n\n`
                + `## Details \n${turndownService.turndown(kb.Details__c || "")} \n\n`
                + `## Summary \n${turndownService.turndown(kb.Summary || "")} \n\n`
                + `## Notes \n${turndownService.turndown(kb.Internal_Notes__c || "")} \n\n`
                + `## Steps \n ${turndownService.turndown(kb.Steps__c || "")}`
                kbMarkdown.push(mdContent);
    }
    return kbMarkdown;
}

async function getKbs() {
    let soql =  `SELECT Knowledge_Article__r.ArticleNumber, 
            Knowledge_Article__r.Details__c , 
            Knowledge_Article__r.Internal_Notes__c ,  
            Knowledge_Article__r.Steps__c , 
            Knowledge_Article__r.Summary ,  
            Knowledge_Article__r.Taxonomy_Path__c , 
            Knowledge_Article__r.Title 
        FROM Knowledge_Details__c
        WHERE CreatedDate = N_MONTHS_AGO:${config.get('salesforce.nMonthsAgo')}
        AND (NOT Knowledge_Article__r.Taxonomy_Path__c LIKE  '%Spectrum%') 
        AND (NOT Knowledge_Article__r.Solution_Group__c LIKE '%ProContractor%')`;
   
    var queryUrl = "/services/data/v60.0/queryAll?q="
        + encodeURIComponent(soql.replace(/\s+/g,' ').trim());
    let resp = await query(queryUrl);
    return resp?.records.map(r => r.Knowledge_Article__r);
}

async function query(url) {
    let queryUrl = baseUrl + url;
    let response = await fetch(queryUrl, { 
        method : "GET", 
        headers : { 
        "Authorization" : `OAuth ${token}`
        } 
    });
    let content =  await response.text();
    return JSON.parse(content);
}

