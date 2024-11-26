/**
 * Model definition for seo
 */
export interface ISeo {
  id: string;
  metaTitle: string;
  metaDescription: string;
  //metaImage: Blob;
  metaSocial: any[];
  keywords?: string;
  metaRobots?: string;
  structuredData?: { [key: string]: any };
  metaViewport?: string;
  canonicalURL?: string;
}
