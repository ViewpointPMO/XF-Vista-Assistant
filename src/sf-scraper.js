import TurndownService from 'turndown';
import config from 'config';

const baseUrl = config.get('salesforce.baseUrl');
const token = config.get('salesforce.token');


export default async function scrapeCases() {
    let cases = await getCases();
    return await convertToMarkdown(cases);
}

async function convertToMarkdown(cases) {
    let caseMarkdown = [];
    let turndownService = new TurndownService();
    for (const c of cases) {
        let soql =  `
            SELECT TextBody , HtmlBody , CreatedDate 
            FROM EmailMessage
            Where ParentId = '${c.Id}'
            ORDER BY CreatedDate DESC`;
        var queryUrl = "/services/data/v60.0/queryAll?q="
            + encodeURIComponent(soql.replace(/\s+/g,' ').trim());
        let resp = await query(queryUrl);
        let email = resp.records.length > 0 ? turndownService.turndown(resp.records[0].HtmlBody) : "";
        let mdContent = `## Keywords \nVista, Transformation, XF, Viewpoint, Cloud, ${c.Support_Product__r?.Name} ${c.Module_Portal__c} \n\n`
                + `## Source \nSalesforce Case: ${c.CaseNumber}\n\n`
                + `# Subject \n${c.Subject || ""} \n\n`
                + `## Description \n${c.Description || ""} \n\n`
                + `## Resolution \n${c.Resolution_Notes__c || ""} \n\n`
                + `# Email Messages \n ${email || ""}`
        caseMarkdown.push(mdContent);
    }
    return caseMarkdown;
}

export async function getCases() {
    let cases = [];
    let soql =  `SELECT Id,
            Subject,
            Description,
            Resolution_Notes__c,
            CaseNumber,
            Support_Product__r.Name, 
            Module_Portal__c, 
            Owner.Name 
        FROM Case          
        WHERE ClosedDate = N_MONTHS_AGO:${config.get('salesforce.nMonthsAgo')}           
            AND Type = 'Cloud - Transformations'
            AND Account_ERP__c <> 'Spectrum'
            AND (Not Subject Like '%team, analytics%')
            AND (Not Subject Like '%ready for install%')
            AND (Not Subject Like '%initial data migration%')
            AND (Not Subject Like '%decommission vfc%')
            AND Owner.Name <> 'Cloud Transformation Holding'`;
   
    var queryUrl = "/services/data/v60.0/queryAll?q="
        + encodeURIComponent(soql.replace(/\s+/g,' ').trim());
    let resp = await query(queryUrl);
    cases = cases.concat(resp?.records);
    while(resp.nextRecordsUrl) {
        resp = await query(resp.nextRecordsUrl);
        cases = cases.concat(resp?.records);
    }
   return cases;
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

