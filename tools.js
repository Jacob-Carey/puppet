const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const HTMLParser = require('node-html-parser');
const geolocations = [
    { country: 'Australia', lat: -31.9522, long: 115.8614 },
    { country: 'Austria', lat: 48.2190, long: 16.4950 },
    { country: 'Belgium', lat: 50.8504, long: 4.3488 },
    { country: 'Bulgaria', lat: 42.6978, long: 23.3424 },
    { country: 'Canada', lat: 46.1159, long: -64.8019 },
    { country: 'Croatia', lat: 46.4242, long: 16.4336 },
    { country: 'Cyprus', lat: 35.1667, long: 33.3667 },
    { country: 'Czech Republic', lat: 50.0880, long: 14.4208 },
    { country: 'Denmark', lat: 55.6759, long: 12.5655 },
    { country: 'Estonia', lat: 59.4370, long: 24.7535 },
    { country: 'Finland', lat: 60.1695, long: 24.9354 },
    { country: 'France', lat: 50.6942, long: 3.1746 },
    { country: 'Germany', lat: 48.1374, long: 11.5755 },
    { country: 'Greece', lat: 40.4967, long: 22.9886 },
    { country: 'Hungary', lat: 47.4980, long: 19.0399 },
    { country: 'Ireland', lat: 53.3440, long: -6.2672 },
    { country: 'Italy', lat: 41.8947, long: 12.4839 },
    { country: 'Latvia', lat: 56.9460, long: 24.1059 },
    { country: 'Lithuania', lat: 54.6892, long: 25.2798 },
    { country: 'Luxembourg', lat: 49.6117, long: 6.1300 },
    { country: 'Malta', lat: 36.0500, long: 14.2644 },
    { country: 'Netherlands', lat: 52.0908, long: 5.1222 },
    { country: 'Poland', lat: 53.0862, long: 21.5757 },
    { country: 'Portugal', lat: 41.4444, long: -8.2962 },
    { country: 'Romania', lat: 45.7494, long: 21.2272 },
    { country: 'Russia', lat: 60.0494, long: 30.4459 },
    { country: 'Slovakia', lat: 48.1482, long: 17.1067 },
    { country: 'Slovenia', lat: 46.1655, long: 14.3063 },
    { country: 'Spain', lat: 40.6333, long: -3.1667 },
    { country: 'Sweden', lat: 59.3326, long: 18.0649 },
    { country: 'United Kingdom', lat: 50.8284, long: -0.1395 },
    { country: 'United States', lat: 40.5732, long: -111.8865 }
]
const key = 'addgoogletranslateapikey'
const googleTranslate = require('google-translate')(key);
const main = require('./main');

module.exports = {
    // variables
    failed: [],
    succeeded: [],
    master: [],
    total: 0,
    count: 0,

    // imports a csv, and returns the csv as an array of objects 
    importCsv: function () {
        var arr = [];
        var objArr = [];
        let data = fs.readFileSync('ba_RO.csv', 'utf8');
        let bufferString = data.toString();
        arr = bufferString.split('\n');
        var headers = arr[0].split(',');
        for (var i = 1; i < arr.length; i++) {
            let data = arr[i].split(',');
            let obj = {};
            for (var j = 0; j < data.length; j++) {
                obj[headers[j].trim()] = data[j].trim();
            }

            for (country of geolocations) {

                if (country.country == obj.country) {
                    obj.lat = country.lat;
                    obj.long = country.long;
                }
            }

            objArr.push(obj);
        }
        this.total = objArr.length;
        return objArr;
    },

    // assigns a lat and long based on country passed in
    // geo locations available are stored at top of page for now
    // new locations can be added if need be
    // mostly eu currently
    getGeolocation: function (obj) {

        for (country of geolocations) {

            if (country.country == obj.country) {
                obj.lat = country.lat;
                obj.long = country.long;
                return obj;
            }
        }
    },

    // creates a delay for as many ms passed in
    timeout: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // takes a full page screenshot and saves it to a file to be determined by 'path'
    // can be heavily modified.
    // working fairly well in bulk
    screenshot: async function (obj, browser) {
        let path = `C:/Users/jacob.carey/Documents/consentv2/screenshots/${obj.country}/${obj.url}_${obj.snid}.png`
        const page = await browser.newPage();
        await page.setGeolocation({ latitude: obj.lat, longitude: obj.long });
        await page.setViewport({ width: 1280, height: 800 })
        try {
            await page.goto('https://' + obj.url, { timeout: 60000, waitUntil: 'domcontentloaded' });
            await this.timeout(2000);
            await page.screenshot({ path: path, fullPage: true })
                .then(() => {
                    console.log('✅ screenshot of ' + obj.url + ' has succeeded')
                    this.count++
                    console.log(`${this.count} of ${this.total} complete`)
                    console.log(`${this.failed.length} of ${this.total} failed`)
                    console.log(`${this.succeeded.length} of ${this.total} succeeded`)
                    obj.screenshot = path;
                    this.succeeded.push(obj)
                })
            await page.close();
        } catch (err) {
            console.log(`❌ screenshot of ${obj.url} has failed`)
            this.count++
            console.log(`${this.count} of ${this.total} complete`)
            console.log(`${this.failed.length} of ${this.total} failed`)
            console.log(`${this.succeeded.length} of ${this.total} succeeded`)
            obj.screenshot = '';
            this.failed.push(obj)
            await page.close();
        }

    },

    // gets evidon banner css for each element in it
    // the banner itself, buttons, etc..
    // creates an array of objects
    getEvidonBannerCss: async function (obj, browser) {
        const page = await browser.newPage();
        try {
            await page.goto('https://' + obj.url, { waitUntil: 'domcontentloaded' });
            // page.waitForSelector("#_evidon_banner", { visible: true })
            var banner = await page.evaluate(() => document.querySelector("#_evidon_banner").outerHTML)
            var parser = HTMLParser.parse(banner)
            var nodes = parser.childNodes[0].childNodes
            var bannerElementObjs = []
            nodes.forEach((item) => {
                let bannerDetails = {
                    name: item.tagName,
                    type: item.tagType,
                    rawAttrs: item.rawAttrs,
                    text: item.rawText,
                }
                bannerElementObjs.push(bannerDetails)
            })
            console.log(obj.url + ' succeeded')
            obj.bannerDetails = bannerElementObjs
            this.master.push(obj)
            // await page.close();

        } catch (err) {
            console.log(obj.url + ' failed')

        }
        // await page.close()
    },

    // gets evidon banner text and attempts to translate it to english 
    // TODO: problems finding evidon banner element  
    getBannerText: async function (obj, browser) {
        const page = await browser.newPage();
        await page.setGeolocation({ latitude: obj.lat, longitude: obj.long });
        await page.setViewport({ width: 1280, height: 800 })
        await page.goto('https://' + obj.url);
        const element = await page.$("#_evidon-banner");
        const element2 = await page.$("#_evidon_banner");
        const tempText = ''
        try {
            if (element != null) {
                await page.evaluate(element => element.textContent, element);
                googleTranslate.translate(tempText, 'en', (err, translation) => {
                    obj.text = translation.translatedText
                })
            } else {
                await page.evaluate(element2 => element2.textContent, element2);
                googleTranslate.translate(tempText, 'en', (err, translation) => {
                    obj.text = translation.translatedText
                })
            }

        } catch (err) {
            console.log(obj.url + ' failed')
            obj.text = 'failed'
            this.master.push(obj)
            //await page.close()
        }

        this.master.push(obj)
        await page.close()
    },

    // gets specific dom node and returns the elements computed styles
    // which is a massive array and will need to be parsed
    getSpecificNode: async function (browser) {
        const page = await browser.newPage();
        await page.goto('https://www.bastillebastille.com/');
        await page._client.send('DOM.enable');
        await page._client.send('CSS.enable');
        const doc = await page._client.send('DOM.getDocument');
        const nodes = await page._client.send('DOM.querySelectorAll', {
            nodeId: doc.root.nodeId,
            selector: '#_evidon_banner'
        });

        const stylesForNodes = []
        for (id of nodes.nodeIds) {
            stylesForNodes.push(await page._client.send('CSS.getComputedStyleForNode', { nodeId: id }));
        }

        // stylesForNodes.forEach((item) => {
        //     console.log(item.computedStyle.FontFace)
        // })

        return stylesForNodes;
    },

    // gets all network requests, and saves them to a txt file
    getNetworkRequests: async function (url, browser) {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.setDefaultNavigationTimeout(500000);
        var data = [];
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().length > 0) {
                data.push(interceptedRequest.url())
                interceptedRequest.continue();
                //console.log(interceptedRequest)
            }
            else {
                interceptedRequest.continue();
            }
        });

        await page.goto(url);
        await page._client.send('Performance.enable');
        const response = await page._client.send('Performance.getMetrics');
        console.log(response);

        var metrics = await page.metrics();
        console.log(metrics)

        await browser.close();

        fs.writeFile("network_requests/test.txt", data, function (err) {
            if (err) {
                console.log(err);
            }
            console.log(data);
            console.log('Total network requests = ' + data.length);


        })
    },

    // gets page page metrics and saves them to a txt
    getMetrics: async function (url, browser) {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(600000);
        await page.goto(url);
        await page._client.send('Performance.enable');
        const response = await page._client.send('Performance.getMetrics');
        console.log(response);

        await browser.close();

        fs.writeFile("metrics/test.txt", response, function (err) {
            if (err) {
                console.log(err);
            }
        })
    }
}

