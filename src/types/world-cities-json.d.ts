declare module 'world-cities-json' {
    export interface WorldCity {
      name:       string;
      country:    string;
      subcountry: string;
      geonameid:  string;
    }
    const data: WorldCity[];
    export default data;
  }
  