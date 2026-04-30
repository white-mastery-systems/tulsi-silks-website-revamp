/** Editor.js root shape stored on API `content` */
export interface EditorJsRoot {
  time?: number;
  version?: string;
  blocks: EditorJsBlock[];
}

export interface EditorJsBlock {
  type: string;
  data: Record<string, unknown>;
}

/** Normalized blog row for listing / cards (API + mocks) */
export interface BlogListItem {
  _id: string;
  name: string;
  image: string;
  /** HTML snippet from CMS */
  description?: string;
  created_on?: string | Date;
  author?: string;
  category?: string;
  tags?: string[];
  seo_status?: boolean;
  seo_details?: { page_url?: string };
}
