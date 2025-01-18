import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path, { dirname } from 'path';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';
import { Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

interface ScrapedData {
  price: string;
  expenses: string;
  location: string;
  href: string;
  images: string[];
  discount: string;
  titleTypeSupProperty: string;
  daysPublished: string;
  views: string;
}

const removeDuplicates = (data: ScrapedData[]): ScrapedData[] => {
  const uniqueDataMap = new Map<string, ScrapedData>();
  data.forEach((item) => {
    if (!uniqueDataMap.has(item.href)) {
      uniqueDataMap.set(item.href, item);
    }
  });
  return Array.from(uniqueDataMap.values());
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const autoScroll = async (page: Page) => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const delay = 100;
      const timer = setInterval(() => {
        const { scrollHeight } = document.body;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  });
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--start-maximized'],
    defaultViewport: null,
  });

  const listingPage = await browser.newPage();

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const baseUrl = 'https://www.zonaprop.com.ar';
  const maxPages = 40;
  const allScrapedData: ScrapedData[] = [];
  const scrapedHrefs = new Set<string>();

  const limit = pLimit(27);

  const outputPath = path.resolve(__dirname, '../../../scraped_data.json');

  if (fs.existsSync(outputPath)) {
    try {
      const rawData = fs.readFileSync(outputPath, 'utf-8');
      const existingData: ScrapedData[] = JSON.parse(rawData);
      const dedupedExistingData = removeDuplicates(existingData);
      dedupedExistingData.forEach((item) => scrapedHrefs.add(item.href));
      allScrapedData.push(...dedupedExistingData);
      console.log(
        `Cargados ${dedupedExistingData.length} datos existentes y eliminados duplicados.`
      );
    } catch (err) {
      console.error('Error al leer o parsear scraped_data.json:', err);
    }
  }

  await listingPage.setRequestInterception(true);
  listingPage.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['image', 'stylesheet', 'font', 'script'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  const scrapeOnce = async () => {
    let currentPage = 1;
    while (currentPage <= maxPages) {
      const url = `${baseUrl}/departamentos-alquiler-capital-federal-pagina-${currentPage}.html`;
      console.log(`\nNavegando a la página de listados: ${url}`);

      await listingPage.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      try {
        await listingPage.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
      } catch (err) {
        console.error(`Error al navegar a la página ${url}:`, err);
        currentPage++;
        continue;
      }

      try {
        await listingPage.waitForSelector('[data-qa="POSTING_CARD_PRICE"]', {
          timeout: 15000,
        });
      } catch (err) {
        console.error(`Selector no encontrado en la página ${url}:`, err);
        currentPage++;
        continue;
      }

      const propertyLinks: string[] = await listingPage.evaluate((baseUrl) => {
        const anchors = document.querySelectorAll(
          '[data-qa="POSTING_CARD_DESCRIPTION"] a'
        );
        const links: string[] = [];
        anchors.forEach((a) => {
          const rawHref = a.getAttribute('href') ?? '';
          const fullHref = rawHref.startsWith('http')
            ? rawHref
            : `${baseUrl}${rawHref}`;
          if (fullHref && !links.includes(fullHref)) {
            links.push(fullHref);
          }
        });
        return links;
      }, baseUrl);

      console.log(
        `Propiedades encontradas en la página ${currentPage}: ${propertyLinks.length}`
      );

      const processProperty = async (link: string) => {
        if (scrapedHrefs.has(link)) {
          console.log(`Propiedad ya procesada: ${link}`);
          return;
        }

        scrapedHrefs.add(link);

        const detailPage = await browser.newPage();
        try {
          await detailPage.setRequestInterception(true);
          detailPage.on('request', (request) => {
            request.continue();
          });

          console.log(`>>> Navegando a la propiedad: ${link}`);
          await detailPage.goto(link, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });

          await autoScroll(detailPage);
          await delay(200);

          try {
            await detailPage.waitForSelector('#multimedia-content', {
              timeout: 10000,
            });
          } catch (err) {
            console.error(
              `Selector '#multimedia-content' no encontrado en ${link}:`,
              err
            );
            return;
          }

          const discountPromise = detailPage
            .waitForSelector('.block-discount .discount-container', {
              timeout: 1000,
            })
            .then((element) =>
              detailPage.evaluate(
                (el) => (el ? el.textContent?.trim() ?? '' : ''),
                element
              )
            )
            .catch(() => '');

          const dataFromDetailPromise: Promise<ScrapedData> =
            detailPage.evaluate(() => {
              const extractText = (
                selector: string,
                regex?: RegExp
              ): string => {
                const element = document.querySelector(selector);
                if (!element?.textContent) return '';
                let text = element.textContent.replace(/\s+/g, ' ').trim();
                if (regex) {
                  const match = regex.exec(text);
                  return match ? match[0] : '';
                }
                return text;
              };

              const price = extractText(
                '.price-value',
                /(?:\$|USD)\s?[\d.,]+/i
              );
              const expenses = extractText(
                '.price-expenses',
                /(?:Expensas\s*\$?\s?[\d.,]+)/i
              );
              const location = extractText(
                '.section-location-property.section-location-property-classified'
              );
              const titleTypeSupProperty = extractText(
                '.title-type-sup-property',
                /^.+$/
              );

              const daysPublishedElement =
                document.querySelector('#user-views p');
              const daysPublished = daysPublishedElement
                ? daysPublishedElement.textContent?.trim() ?? ''
                : '';

              const viewsElement = Array.from(
                document.querySelectorAll('#user-views p')
              ).find((p) => p.textContent?.includes('visualizaciones'));
              const views = viewsElement
                ? (viewsElement.textContent?.match(/\d+/) || [''])[0]
                : '';

              const images: string[] = [];
              const multimediaContent = document.querySelector(
                '#multimedia-content'
              );
              if (multimediaContent) {
                multimediaContent.querySelectorAll('img').forEach((img) => {
                  const src =
                    img.getAttribute('src') ??
                    img.getAttribute('data-flickity-lazyload');
                  if (src?.includes('zonapropcdn.com')) {
                    images.push(src);
                  }
                });
              }

              return {
                price,
                expenses,
                location,
                href: window.location.href,
                images,
                discount: '',
                titleTypeSupProperty,
                daysPublished,
                views,
              };
            });

          const [dataFromDetail, discount] = await Promise.all([
            dataFromDetailPromise,
            discountPromise,
          ]);

          dataFromDetail.discount = discount;

          allScrapedData.push(dataFromDetail);
          console.log('Datos extraídos:', dataFromDetail);
        } catch (err) {
          console.error('Error extrayendo datos de una propiedad:', err);
        } finally {
          await detailPage.close();
        }
      };

      const promises = propertyLinks.map((link) =>
        limit(() => processProperty(link))
      );

      await Promise.all(promises);

      currentPage++;
    }

    try {
      fs.writeFileSync(outputPath, JSON.stringify(allScrapedData, null, 2));
      console.log(`\nDatos guardados en ${outputPath}`);
    } catch (err) {
      console.error('Error al guardar los datos en scraped_data.json:', err);
    }
  };

  const startScrapingLoop = async () => {
    while (true) {
      console.log('\n=== Iniciando proceso de scraping ===');
      try {
        await scrapeOnce();
      } catch (err) {
        console.error('Error en el proceso de scraping:', err);
      }

      console.log('\n=== Proceso de scraping completado ===');
      console.log('Esperando 30 minutos antes de la próxima ejecución...\n');

      await delay(1800000);
    }
  };

  startScrapingLoop().catch((err) => {
    console.error('Error en el bucle de scraping:', err);
  });

  process.on('SIGINT', async () => {
    console.log('\nRecibida señal de interrupción. Cerrando navegador...');
    await browser.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nRecibida señal de terminación. Cerrando navegador...');
    await browser.close();
    process.exit(0);
  });
})();
