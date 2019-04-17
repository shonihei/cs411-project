interface RawLatLong {
  lat: number;
  long: number;
}

interface Source {
  id: string;
  name: string;
}

interface OID {
  $oid: string;
}

export interface ArticleInfo {
  author?: string;
  content?: string;
  description?: string;
  latlong?: RawLatLong;
  publishedAt?: string;
  slug?: string;
  source?: Source;
  title?: string;
  url?: string;
  urlToImage?: string;
  _id?: OID;
}

export interface ArticleResponse {
  articles: ArticleInfo[];
}
