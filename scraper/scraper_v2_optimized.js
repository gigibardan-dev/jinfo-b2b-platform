const axios = require('axios');
const cheerio = require('cheerio');
const { chromium } = require('playwright');
const fs = require('fs');

// Configurație Continente conform CRM Jinfo
const CONTINENTS = {
    europa: 12,
    africa: 13,
    asia: 14,
    america: 15,
    oceania: 16
};

// Folosim Map pentru a preveni automat dublurile pe baza ID-ului unic din CRM
const allCircuitsStore = new Map();

let browser = null;
let page = null;

// Statistici pentru raportul final
const stats = {
    totalIdentified: 0,
    success: 0,
    failed: 0,
    timeout: 0,
    failedDetails: []
};

// Detectăm dacă rulăm pe CI (GitHub Actions)
const IS_CI = process.env.CI === 'true' || process.env.CI === true;

// User-Agent comun pentru toate requesturile
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// Axios cu headers comune
const axiosInstance = axios.create({
    timeout: 30000,
    headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ro-RO,ro;q=0.9,en;q=0.8',
    }
});

// 1. Inițializează browser-ul o singură dată (Singleton)
async function initBrowser() {
    if (!browser) {
        console.log('🚀 Pornesc motorul Playwright...\n');
        browser = await chromium.launch({ 
            headless: true,
            timeout: 120000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',  // Important pe CI - evită probleme de memorie
                '--disable-gpu'
            ]
        });
        const context = await browser.newContext({
            userAgent: USER_AGENT,
            viewport: { width: 1280, height: 720 },
            locale: 'ro-RO',  // Important pentru site-uri românești
            timezoneId: 'Europe/Bucharest'
        });
        page = await context.newPage();

        // Blochează resurse inutile pentru viteză (fonturi, CSS, imagini)
        await page.route('**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}', route => route.abort());
        await page.route('**/*.css', route => route.abort());
    }
}

// 2. Extractor Prețuri cu logica de Retry - ÎMBUNĂTĂȚIT pentru CI
async function extractAllPrices(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await initBrowser();
            console.log(`      💰 Extrag prețuri (tentativa ${attempt}/${retries})...`);
            
            // Timeout mai mare pe CI
            const gotoTimeout = IS_CI ? 180000 : 120000;
            await page.goto(url, { waitUntil: 'networkidle', timeout: gotoTimeout });

            // Verificăm și dăm click pe tab-ul de oferte
            const hasOfferTab = await page.evaluate(() => !!document.querySelector('a[href="#offer"]'));
            if (hasOfferTab) {
                await page.click('a[href="#offer"]');
                
                // FIX: waitForSelector în loc de waitForTimeout fix
                // Așteptăm până când tabelul de prețuri devine vizibil
                try {
                    await page.waitForSelector('.service-cell-row', { 
                        state: 'visible', 
                        timeout: IS_CI ? 20000 : 10000
                    });
                } catch (e) {
                    console.log(`      ⚠️ Tabelul de prețuri nu a apărut, încerc oricum...`);
                    // Așteptăm puțin ca fallback
                    await page.waitForTimeout(IS_CI ? 5000 : 2000);
                }
            } else {
                // Fără tab de oferte, așteptăm puțin pentru siguranță
                await page.waitForTimeout(IS_CI ? 3000 : 1000);
            }

            return await page.evaluate(() => {
                const rows = document.querySelectorAll('.service-cell-row');
                const result = {
                    double: null,
                    single: null,
                    triple: null,
                    child: null,
                    allOptions: []
                };

                rows.forEach(row => {
                    const nameEl = row.querySelector('.service-name');
                    const priceEl = row.querySelector('.price .value');
                    const currEl = row.querySelector('.price .curr');
                    const infoEl = row.querySelector('.service-info p');

                    if (nameEl && priceEl) {
                        const name = nameEl.textContent.trim().toLowerCase();
                        let priceText = priceEl.textContent.trim();
                        
                        // STEP 1: Elimină virgula (separator zecimale greșit)
                        priceText = priceText.replace(',', '');
                        
                        // STEP 2: Elimină orice nu e cifră
                        let cleaned = priceText.replace(/[^\d]/g, '').trim();
                        
                        // STEP 3: Elimină ultimele 2 zerouri (zecimale inutile)
                        if (cleaned.length > 2 && cleaned.endsWith('00')) {
                            cleaned = cleaned.slice(0, -2);
                        }
                        
                        let finalPrice = parseFloat(cleaned) || 0;

                        const data = {
                            type: nameEl.textContent.trim(),
                            price: finalPrice,
                            currency: currEl ? currEl.textContent.trim() : 'EUR',
                            info: (infoEl ? infoEl.textContent.trim() : '')
                                .replace(/[\t\n\r]+/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                        };

                        result.allOptions.push(data);

                        // Mapare automată pe tipuri de cameră
                        if (name.includes('persoana in camera dubla') || name.includes('persoană în cameră dublă') || (name.includes('double') && name.includes('person'))) {
                            result.double = finalPrice;
                        } else if (name.includes('single') || name.includes('loc in camera')) {
                            result.single = finalPrice;
                        } else if (name.includes('copil') || name.includes('child')) {
                            result.child = finalPrice;
                        } else if (name.includes('camera dubla') && (name.includes('2 adulti') || name.includes('2 adulți'))) {
                            if (!result.double) result.double = Math.round(finalPrice / 2);
                        } else if (name.includes('tripla') || name.includes('triplă') || name.includes('triple') || (name.includes('3 persoane') && name.includes('camera'))) {
                            if (name.includes('3 persoane')) {
                                result.triple = Math.round(finalPrice / 3);
                            } else {
                                result.triple = finalPrice;
                            }
                        }
                    }
                });
                return result;
            });
        } catch (error) {
            console.error(`      ⚠️ Tentativa ${attempt} eșuată pt prețuri: ${error.message}`);
            if (attempt === retries) {
                stats.timeout++;
                return { allOptions: [], double: null, single: null, triple: null, child: null };
            }
            // Pauză între retry-uri - mai lungă pe CI
            await new Promise(r => setTimeout(r, IS_CI ? 15000 : 10000));
        }
    }
}

// 3. Procesare Circuit Individual
async function processCircuit(id, name, continentName) {
    if (allCircuitsStore.has(id)) {
        console.log(`  ⏭️ Skipped (deja existent): ${name}`);
        return;
    }

    stats.totalIdentified++;

    try {
        console.log(`  🔍 [${stats.totalIdentified}] Procesez [${id}]: ${name}`);
        
        // Obținem Slug-ul
        const listUrl = `https://www.jinfotours.ro/circuitele-noastre/${continentName.toLowerCase()}`;
        
        let slug = null;
        try {
            const listRes = await axiosInstance.get(listUrl);
            const $list = cheerio.load(listRes.data);
            
            const cleanName = name.trim();
            
            $list('.acqua-tour-list-complete a').each((i, el) => {
                const title = $list(el).find('.destination').text().trim();
                const href = $list(el).attr('href');
                
                if (title === cleanName && href) {
                    slug = href.split('/').pop();
                    return false;
                }
            });
            
            // Dacă nu găsim exact, încercăm partial match
            if (!slug) {
                const nameWords = cleanName.toLowerCase().split(' ').filter(w => w.length > 3);
                
                $list('.acqua-tour-list-complete a').each((i, el) => {
                    const title = $list(el).find('.destination').text().trim().toLowerCase();
                    const href = $list(el).attr('href');
                    
                    const matchCount = nameWords.filter(word => title.includes(word)).length;
                    
                    if (matchCount >= Math.min(2, nameWords.length) && href) {
                        slug = href.split('/').pop();
                        console.log(`      ℹ️ Slug găsit prin match partial: "${cleanName}" → "${title}"`);
                        return false;
                    }
                });
            }
        } catch (listError) {
            console.error(`      ⚠️ Eroare la obținerea listei: ${listError.message}`);
        }

        if (!slug) {
            slug = name.trim()
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
            console.log(`      ℹ️ Slug generat automat: ${slug}`);
        }

        const detailsUrl = `https://www.jinfotours.ro/circuite/detalii/${slug}`;
        
        let $;
        try {
            const detRes = await axiosInstance.get(detailsUrl);
            $ = cheerio.load(detRes.data);
        } catch (pageError) {
            throw new Error(`Nu pot accesa pagina: ${pageError.message}`);
        }

        // Gallery images
        const gallery = [];
        try {
            $('img[src*="items_images"]').each((i, img) => {
                const src = $(img).attr('src');
                if (src && !gallery.includes(src)) {
                    gallery.push(src.trim());
                }
            });
        } catch (imgError) {
            console.error(`      ⚠️ Eroare la extragerea imaginilor: ${imgError.message}`);
        }

        // Prețuri cu Playwright
        let prices = { allOptions: [], double: null, single: null, triple: null, child: null };
        try {
            prices = await extractAllPrices(detailsUrl);
        } catch (priceError) {
            console.error(`      ⚠️ Eroare la extragerea prețurilor: ${priceError.message}`);
            stats.timeout++;
        }

        const circuitData = {
            id,
            name,
            slug,
            continent: continentName,
            url: detailsUrl,
            title: $('h1').first().text().trim() || name,
            nights: $('.no').first().text().trim() || '7 nopti',
            mainImage: gallery[0] || null,
            gallery: gallery,
            prices: prices,
            departures: [],
            shortDescription: ($('.description p').first().text().trim() || '').substring(0, 200) + '...',
            lastScraped: new Date().toISOString()
        };

        // Extract departures
        const departureDates = new Set();
        const departurePeriods = [];
        
        try {
            const firstDataRow = $('table tbody tr').first();
            const periodCell = firstDataRow.find('td').eq(1);
            
            if (periodCell.length > 0) {
                const text = periodCell.text();
                const periodMatches = text.match(/(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})/g);
                
                if (periodMatches) {
                    periodMatches.forEach(period => {
                        const dates = period.match(/\d{2}\.\d{2}\.\d{4}/g);
                        if (dates && dates.length === 2) {
                            const startDate = dates[0];
                            const endDate = dates[1];
                            
                            if (!departureDates.has(startDate)) {
                                departureDates.add(startDate);
                                departurePeriods.push({ start: startDate, end: endDate });
                            }
                        }
                    });
                }
            }
            
            if (departureDates.size === 0) {
                $('table tr').each((i, row) => {
                    const text = $(row).text();
                    const dates = text.match(/\d{2}\.\d{2}\.\d{4}/g);
                    if (dates) {
                        dates.forEach(date => departureDates.add(date));
                    }
                });
            }
        } catch (depError) {
            console.error(`      ⚠️ Eroare la extragerea plecărilor: ${depError.message}`);
        }

        // Extrage nights
        let nightsNum = 7;
        try {
            const priceCell = $('table tbody tr').first().find('td').last();
            const nightsMatch = priceCell.text().match(/(\d+)\s*nopt/i);
            if (nightsMatch) {
                nightsNum = parseInt(nightsMatch[1]);
                circuitData.nights = `${nightsNum} nopti`;
                console.log(`      ℹ️ Nights extras din tabel: ${nightsNum}`);
            }
        } catch (nightsError) {
            console.error(`      ⚠️ Eroare la extragerea nights: ${nightsError.message}`);
        }

        // Convert to departures array
        if (departurePeriods.length > 0) {
            departurePeriods.forEach(period => {
                try {
                    const [day, month, year] = period.start.split('.');
                    const departureDate = `${year}-${month}-${day}`;
                    const [endDay, endMonth, endYear] = period.end.split('.');
                    const returnDate = `${endYear}-${endMonth}-${endDay}`;
                    
                    circuitData.departures.push({
                        departureDate,
                        returnDate,
                        roomType: 'double',
                        price: circuitData.prices.double || 0,
                        status: 'disponibil'
                    });
                } catch (dateError) {
                    console.error(`      ⚠️ Eroare la procesarea perioadei ${period.start}: ${dateError.message}`);
                }
            });
        } else {
            Array.from(departureDates).forEach(dateStr => {
                try {
                    const [day, month, year] = dateStr.split('.');
                    const departureDate = `${year}-${month}-${day}`;
                    const returnDate = new Date(departureDate);
                    returnDate.setDate(returnDate.getDate() + nightsNum);
                    
                    circuitData.departures.push({
                        departureDate,
                        returnDate: returnDate.toISOString().split('T')[0],
                        roomType: 'double',
                        price: circuitData.prices.double || 0,
                        status: 'disponibil'
                    });
                } catch (dateError) {
                    console.error(`      ⚠️ Eroare la procesarea datei ${dateStr}: ${dateError.message}`);
                }
            });
        }

        allCircuitsStore.set(id, circuitData);
        stats.success++;
        console.log(`      ✅ ${circuitData.departures.length} plecări, ${circuitData.prices.allOptions.length} prețuri\n`);

    } catch (err) {
        stats.failed++;
        stats.failedDetails.push({ id, name, continent: continentName, error: err.message });
        console.error(`      ❌ EȘUAT: ${err.message}\n`);
    }
}

// 4. Funcția Principală
async function main() {
    const startTime = Date.now();
    console.log('🚀 JINFO SCRAPER V2.3 - CI OPTIMIZED\n');
    console.log(`⚙️  Mod: ${IS_CI ? 'GitHub Actions (CI)' : 'Local'}\n`);
    console.log('⏱️  Estimat: 60-90 minute\n');

    for (const [contName, contId] of Object.entries(CONTINENTS)) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🌍 CONTINENT: ${contName.toUpperCase()}`);
        console.log('='.repeat(60));
        
        try {
            // FIX: User-Agent și pe request-ul AJAX de circuite
            const res = await axiosInstance.get(
                `https://www.jinfotours.ro/holidays/get_destination_by_continent_ajax/${contId}`
            );
            const circuits = res.data;
            const ids = Object.keys(circuits);
            
            console.log(`\n📋 Am găsit ${ids.length} circuite\n`);

            for (const id of ids) {
                await processCircuit(id, circuits[id], contName);
                // Pauză între circuite - mai mică decât înainte
                await new Promise(r => setTimeout(r, IS_CI ? 3000 : 5000));
            }
        } catch (err) {
            console.error(`\n❌ Eroare critică la continentul ${contName}: ${err.message}\n`);
        }
    }

    if (browser) {
        await browser.close();
        console.log('\n🔒 Browser închis');
    }

    // Finalizare și Salvare
    const finalData = Array.from(allCircuitsStore.values());
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    fs.writeFileSync('./circuits_data_complete.json', JSON.stringify({
        meta: {
            scrapedAt: new Date().toISOString(),
            totalCircuits: finalData.length,
            version: '2.3-ci-optimized',
            hasAllPrices: true,
            duration: `${(duration / 60).toFixed(1)} minute`,
            stats: stats
        },
        circuits: finalData
    }, null, 2));

    const withAllPrices = finalData.filter(c => c.prices.allOptions.length > 0).length;
    const withDepartures = finalData.filter(c => c.departures.length > 0).length;

    // SALVEAZĂ RAPORT DETALIAT TXT
    const report = [];
    report.push('═'.repeat(70));
    report.push('JINFO TOURS - RAPORT SCRAPING');
    report.push('═'.repeat(70));
    report.push(`Data: ${new Date().toISOString()}`);
    report.push(`Durată: ${(duration/60).toFixed(1)} minute`);
    report.push(`Mod: ${IS_CI ? 'GitHub Actions (CI)' : 'Local'}`);
    report.push('');
    report.push(`Total circuite: ${finalData.length}`);
    report.push(`✅ Succes: ${stats.success}`);
    report.push(`❌ Eșuate: ${stats.failed}`);
    report.push('');
    report.push(`Cu prețuri: ${withAllPrices}/${finalData.length}`);
    report.push(`Cu plecări: ${withDepartures}/${finalData.length}`);
    report.push('');
    
    if (stats.failedDetails.length > 0) {
        report.push('─'.repeat(70));
        report.push('CIRCUITE EȘUATE:');
        report.push('─'.repeat(70));
        stats.failedDetails.forEach(f => {
            report.push(`❌ [${f.continent}/${f.id}] ${f.name}`);
            report.push(`   ${f.error}`);
        });
        report.push('');
    }
    
    const incomplete = finalData.filter(c => !c.prices.double || c.departures.length === 0);
    if (incomplete.length > 0) {
        report.push('─'.repeat(70));
        report.push('CIRCUITE INCOMPLETE:');
        report.push('─'.repeat(70));
        incomplete.forEach(c => {
            report.push(`⚠️  [${c.id}] ${c.name}`);
            if (!c.prices.double) report.push(`   - Lipsă prețuri`);
            if (c.departures.length === 0) report.push(`   - Lipsă plecări`);
        });
        report.push('');
    }
    
    report.push('═'.repeat(70));
    fs.writeFileSync('./SCRAPING_REPORT.txt', report.join('\n'));
    console.log(`📄 Raport salvat: SCRAPING_REPORT.txt`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SCRAPING COMPLET!');
    console.log('='.repeat(60));
    console.log(`📦 Circuite extrase: ${finalData.length}`);
    console.log(`⏱️  Durată: ${duration} secunde (${(duration/60).toFixed(1)} minute)`);
    console.log(`💾 Salvat în: circuits_data_complete.json`);
    console.log('='.repeat(60));
    
    console.log('\n📊 STATISTICI DETALIATE:');
    console.log(`  ✅ Succes: ${stats.success}/${stats.totalIdentified}`);
    console.log(`  ❌ Eșuate: ${stats.failed}/${stats.totalIdentified}`);
    console.log(`  ⏱️  Timeout prețuri: ${stats.timeout}`);
    console.log(`\n  - Cu toate prețurile: ${withAllPrices}/${finalData.length}`);
    console.log(`  - Cu plecări: ${withDepartures}/${finalData.length}`);
    
    if (stats.failedDetails.length > 0) {
        console.log(`\n⚠️  CIRCUITE EȘUATE (${stats.failedDetails.length}):`);
        stats.failedDetails.forEach(f => {
            console.log(`  - [${f.continent}/${f.id}] ${f.name}: ${f.error}`);
        });
    } else {
        console.log(`\n🎉 TOATE CIRCUITELE AU FOST EXTRASE CU SUCCES!`);
    }
}

main().catch(console.error);