import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommonService } from '../../../services/common.service';

@Component({
    selector: 'app-customization',
    templateUrl: './customization.component.html',
    styleUrls: ['./customization.component.scss'],
    standalone: false
})

export class CustomizationComponent {

  imgBaseUrl: string = environment.img_baseurl;
  mmExpanded = false;

  constructor(public commonService: CommonService) { }

  openCustomDetails() {
    this.mmExpanded = false;
    this.commonService.customView = false;
    this.commonService.measurementView = false;
    this.commonService.notesView = false;
    if(this.commonService.selected_model) {
      if(this.commonService.selected_model.custom_list?.length) this.commonService.customView = true;
      else if(this.commonService.selected_model.mm_sets?.length) this.commonService.measurementView = true;
      else if(this.commonService.selected_model.notes_list?.length) this.commonService.notesView = true;
    }
  }

  toggleMeasurements(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.mmExpanded = !this.mmExpanded;
  }

  getPreviewSlots(model: any): Array<{ label: string; value: string; image?: string }> {
    if(!model) return [];
    const slots = [
      this.getCustomSlot(model, ['front'], 0, 'Front Neck'),
      this.getCustomSlot(model, ['rear', 'back'], 1, 'Back Neck'),
      this.getCustomSlot(model, ['lining', 'clos', 'extra'], 2, 'Lining')
    ].filter(Boolean) as Array<{ label: string; value: string; image?: string }>;

    const mm = this.getMeasurements(model);
    if(mm.count) {
      const mmImage = model?.mm_sets?.[0]?.image || null;
      // Keep Front / Back / Lining when lining exists; otherwise show Measurements as 3rd tile (reference layout)
      if(slots.length < 3) {
        slots.push({
          label: 'Measurements',
          value: mm.count + ' Saved',
          image: mmImage
        });
      }
    }
    return slots;
  }

  getMeasurements(model: any): {
    unit: string | null;
    count: number;
    summary: string;
    groups: Array<{ name: string; items: Array<{ name: string; value: string }> }>;
  } {
    const sets = model?.mm_sets || [];
    const groups = [];
    let count = 0;

    sets.forEach((set: any, index: number) => {
      const items = [];
      (set?.list || []).forEach((entry: any) => {
        if(!entry?.name) return;
        const raw = entry.value;
        if(raw === undefined || raw === null || String(raw).trim() === '') return;
        items.push({ name: entry.name, value: String(raw) });
      });
      if(!items.length) return;

      const setName = String(set?.name || '').trim();
      const lower = setName.toLowerCase();
      let groupName = setName || ('Set ' + (index + 1));
      if(lower.includes('front')) groupName = 'Front';
      else if(lower.includes('rear') || lower.includes('back')) groupName = 'Rear';

      groups.push({ name: groupName, items });
      count += items.length;
    });

    const unit = model?.mm_unit
      || sets[0]?.unit
      || sets[0]?.units?.[0]?.name
      || sets[0]?.list?.[0]?.unit
      || null;

    const summary = groups.length
      ? groups.map(g => g.name + ' (' + g.items.length + ')').join(' · ')
      : 'No measurements saved';

    return { unit, count, summary, groups };
  }

  getNotes(model: any): Array<{ name: string; value: string }> {
    return (model?.notes_list || [])
      .filter((note: any) => note?.value && String(note.value).trim() !== '')
      .map((note: any) => ({ name: note.name || 'Note', value: String(note.value) }));
  }

  private getCustomSlot(model: any, keys: string[], fallbackIndex: number, displayLabel: string) {
    const list = model?.custom_list || [];
    if(!list.length) return null;

    let item = list.find((entry: any) => {
      const name = String(entry?.name || '').toLowerCase();
      return keys.some(key => name.includes(key));
    });
    if(!item) item = list[fallbackIndex];
    if(!item) return null;

    const values = item.value || [];
    const valueNames = values.map((v: any) => v?.name).filter(Boolean);
    return {
      label: displayLabel,
      value: valueNames.length ? valueNames.join(', ') : '—',
      image: values[0]?.image || null
    };
  }

}
