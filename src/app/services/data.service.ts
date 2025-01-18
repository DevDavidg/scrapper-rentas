import { Injectable } from '@angular/core';
import { ExtendedScrapedData } from '../scraper-card/scraper-card.component';
import {
  convertToPesos,
  extractAmbientes,
  extractM2,
} from '../utils/data-utils';
import scrapedData from '../../../scraped_data.json';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  getData(): ExtendedScrapedData[] {
    return (scrapedData as unknown as ExtendedScrapedData[]).map((item) => ({
      ...item,
      priceInPesos: convertToPesos(item.price),
      titleTypeSupProperty: item.titleTypeSupProperty || '',
      ambientes: extractAmbientes(item.titleTypeSupProperty),
      m2: extractM2(item.titleTypeSupProperty),
      daysPublished: item.daysPublished || '',
      views: item.views || '',
    }));
  }
}
