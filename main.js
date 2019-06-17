const puppeteer = require('puppeteer')
const ObjectsToCsv = require('objects-to-csv');
const tools = require('./tools');
let data = tools.importCsv();
let running = new Set();
let limit = 5;

(async () => {
    let data = tools.importCsv();
    const mainBrowser = await puppeteer.launch({
         devtools: true,
        // slowMo: 500 
    });

    const browser = await mainBrowser.createIncognitoBrowserContext();

    // Bulk Screenshots 
    for (let item of data) {
        console.log('screenshot of ' + item.url + ' in progress.')
        while(running.size >= limit){
            console.log('Queue is full. Please wait for promises to resolve...')
            await Promise.race(running)
        }

        const promise = (async () => {
            await tools.screenshot(item, browser);
            running.delete(promise)
        })()

        running.add(promise)
    }

    if (running.size > 0){
        await Promise.all(running)
    }

    console.log(`${tools.succeeded.length} of ${data.length} succeeded`)
    console.log(`${tools.failed.length} of ${data.length} failed`)
    let master = tools.succeeded.concat(tools.failed);
    console.log(master.length + ' items in master')

    let failedCsv = new ObjectsToCsv(tools.failed);
    await failedCsv.toDisk('C:/Users/jacob.carey/Documents/consentv2/failedScreenshots.csv')

    let succeededCsv = new ObjectsToCsv(tools.succeeded);
    await succeededCsv.toDisk('C:/Users/jacob.carey/Documents/consentv2/succeededScreenshots.csv')

    let csv = new ObjectsToCsv(master);
    await csv.toDisk('C:/Users/jacob.carey/Documents/consentv2/masterScreenshots.csv')



    // // Bulk Banner Scrapping 
    // for (let item of data) {
    //     console.log('Getting text from ' + item.url)
    //     while(running.size >= limit){
    //         console.log('Queue is full. Please wait for promises to resolve...')
    //         await Promise.race(running)
    //     }

    //     const promise = (async () => {
    //         await tools.getEvidonBannerCss(item, browser);
    //         running.delete(promise)
    //     })()

    //     running.add(promise)
    // }

    // if (running.size > 0){
    //     await Promise.all(running)
    // }
    

    // tools.master.forEach((item) => {
    //     console.log(item)
    // })
    
    // await tools.getNetworkRequests('https://www.google.com', browser)

    //await tools.getMetrics('https://www.google.com', browser)
    console.log('DONE')
    
})();
