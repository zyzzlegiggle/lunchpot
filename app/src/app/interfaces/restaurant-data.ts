export interface RestaurantData {
    name: string;
    address: string;
    placeId: string;
    photoLink:string;
    rating: number;
    priceRange: {
        startPrice: {
            currencyCode: string;
            units: number;
        }
        endPrice: {
            currencyCode: string;
            units: number;
        }
    }
}
