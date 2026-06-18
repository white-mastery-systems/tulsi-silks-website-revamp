export type SearchFilterApiField = 'keyword' | 'colour' | 'tag';

export interface SearchFilterGroup {
  _id: string;
  name: string;
  rank: number;
  key: string;
  apiField: SearchFilterApiField;
  options: string[];
}

const COLOUR_FAMILY_MAP: Record<string, string> = {
  red: 'Red', maroon: 'Red', crimson: 'Red', wine: 'Red', ruby: 'Red', burgundy: 'Red',
  pink: 'Pink', rose: 'Pink', magenta: 'Pink', fuchsia: 'Pink', mauve: 'Pink',
  blue: 'Blue', teal: 'Blue', navy: 'Blue', cobalt: 'Blue', 'sky blue': 'Blue', indigo: 'Blue',
  'navy blue': 'Blue', 'turquoise blue': 'Blue', 'sea green': 'Blue',
  green: 'Green', olive: 'Green', mint: 'Green', emerald: 'Green', sage: 'Green', 'lime green': 'Green',
  yellow: 'Yellow', gold: 'Yellow', mustard: 'Yellow', amber: 'Yellow',
  orange: 'Orange', coral: 'Orange', peach: 'Orange', rust: 'Orange',
  purple: 'Purple', violet: 'Purple', lavender: 'Purple', plum: 'Purple',
  black: 'Black', white: 'White', cream: 'White', ivory: 'White', offwhite: 'White', 'off white': 'White',
  brown: 'Brown', beige: 'Brown', tan: 'Brown', coffee: 'Brown',
  grey: 'Grey', gray: 'Grey', silver: 'Grey', charcoal: 'Grey',
  multicolour: 'Multicolour', multicolor: 'Multicolour'
};

const FILTER_API_FIELD_MAP: Record<string, SearchFilterApiField> = {
  'Material': 'keyword',
  'Body Colour': 'colour'
};

export const PRIMARY_FILTER_NAMES = ['Material', 'Body Colour', 'Design', 'Occasion'];

export function toFilterKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function getFilterApiField(name: string): SearchFilterApiField {
  return FILTER_API_FIELD_MAP[name] || 'tag';
}

export function mapAvailableFilters(list: any[]): SearchFilterGroup[] {
  return (list || [])
    .slice()
    .sort((a, b) => (a.rank || 0) - (b.rank || 0))
    .map(group => ({
      _id: group._id,
      name: group.name,
      rank: group.rank,
      key: toFilterKey(group.name),
      apiField: getFilterApiField(group.name),
      options: (group.option_list || []).map((opt: any) => opt.name).filter(Boolean)
    }));
}

export function deriveColourFamily(colour: string): string {
  if(!colour?.trim()) return '';
  const key = colour.trim().toLowerCase();
  if(COLOUR_FAMILY_MAP[key]) return COLOUR_FAMILY_MAP[key];
  for(const [token, family] of Object.entries(COLOUR_FAMILY_MAP)) {
    if(key.includes(token)) return family;
  }
  return colour.trim();
}

export function matchFilterOption(options: string[], value: string): string {
  if(!value?.trim()) return '';
  const normalised = value.trim().toLowerCase();
  const match = options.find(opt => opt.toLowerCase() === normalised);
  return match || value.trim();
}

export function chipOptionsForField(options: string[], selected: string): string[] {
  if(!selected?.trim()) return options;
  const matched = matchFilterOption(options, selected);
  if(options.some(opt => opt.toLowerCase() === matched.toLowerCase())) return options;
  return [matched, ...options];
}
