import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScraperCardComponent } from './scraper-card.component';

describe('ScraperCardComponent', () => {
  let component: ScraperCardComponent;
  let fixture: ComponentFixture<ScraperCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScraperCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScraperCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
