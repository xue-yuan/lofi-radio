import stationsData from './stations.json';

export interface Channel {
    id: string;
    title: string;
    author: string;
    broken?: boolean;
}

export interface StationCategory {
    id: string;
    name: string;
    description: string;
    channels: Channel[];
}

export const STATION_CATEGORIES: StationCategory[] = stationsData as StationCategory[];
