import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import config from 'config';

const baseUrl = config.get('faq.baseUrl');

export default async function scrapeSite() {
    let links = await getNavigation();
    return await convertToMarkdown(links);
}

async function convertToMarkdown(links) {
  var turndownService = new TurndownService()
  let md = [];
  for (const l of links) {
    const content = await getContent(l);
    const $ = cheerio.load(content);
    $('img').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    $('span').filter(function () {
      return $(this).text().toLowerCase().includes('changelog');
    }).closest('section').remove();
    let title = $('h1').first().text();
    let html = $(`div[role="main"]`).html();
    let mdContent = `## Keywords \nVista, Transformation, XF, Viewpoint, Cloud \n\n## Source \n${l}\n\n`;
    md.push(mdContent + turndownService.turndown(html));
  };
  return md;
}

async function getNavigation() {
  let links = [];
  const content = await getContent(`${baseUrl}/trimble.com/vista-cloud-faq/home`)
  const $ = cheerio.load(content);
  $('nav a').each((i, elem) => {
    if(!links.includes($(elem).attr('href'))) {
      links.push(`${baseUrl}${$(elem).attr('href')}`);
    }
  });
  return links;
}

async function getContent(url) {
    const resp =  await fetch(url);
    return await resp.text();
}
