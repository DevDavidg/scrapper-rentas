import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

interface ScrapedData {
  price: string;
  expenses: string;
  location: string;
  href: string;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--start-maximized'],
    defaultViewport: null,
  });

  const page = await browser.newPage();

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const baseUrl = 'https://www.zonaprop.com.ar';
  let currentPage = 1;
  const maxPages = 10;
  const allScrapedData: ScrapedData[] = [];

  try {
    while (currentPage <= maxPages) {
      const url = `${baseUrl}/departamentos-alquiler-capital-federal-pagina-${currentPage}.html`;
      console.log(`Navegando a la página: ${url}`);

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      await page.waitForSelector('[data-qa="POSTING_CARD_PRICE"]', {
        timeout: 60000,
      });

      const scrapedData: ScrapedData[] = await page.evaluate((base) => {
        const items: ScrapedData[] = [];
        const cards = document.querySelectorAll(
          '[data-qa="POSTING_CARD_PRICE"]'
        );

        cards.forEach((card) => {
          const price = card.textContent?.trim() ?? 'No disponible';

          const cardContainer = card.closest(
            '.postingCard-module__posting-container__xqkwW'
          );

          const expenses =
            cardContainer
              ?.querySelector('[data-qa="expensas"]')
              ?.textContent?.trim() ?? 'No especificado';

          const location =
            cardContainer
              ?.querySelector('[data-qa="POSTING_CARD_LOCATION"]')
              ?.textContent?.trim() ?? 'No especificado';

          const hrefRaw =
            cardContainer
              ?.querySelector('[data-qa="POSTING_CARD_DESCRIPTION"] a')
              ?.getAttribute('href') ?? 'No disponible';

          const href = hrefRaw.startsWith('http')
            ? hrefRaw
            : `${base}${hrefRaw}`;

          items.push({ price, expenses, location, href });
        });

        return items;
      }, baseUrl);

      allScrapedData.push(...scrapedData);

      console.log(`Datos extraídos de la página ${currentPage}:`, scrapedData);

      await delay(2000);
      currentPage++;
    }

    const outputPath = 'scraped_data.json';
    fs.writeFileSync(outputPath, JSON.stringify(allScrapedData, null, 2));
    console.log(`Datos guardados en ${outputPath}`);
  } catch (error) {
    console.error('Ocurrió un error durante el scraping:', error);
  } finally {
    await browser.close();
  }
})();
