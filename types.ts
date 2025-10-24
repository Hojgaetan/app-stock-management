export type Currency = 'EUR' | 'USD' | 'XOF';
export type ShippingType = 'direct-air' | 'forwarder-standard' | 'forwarder-express';

export interface ShippingCostDetail {
  shippingCost: number;
  deliveryCost: number;
}

export interface LocalTransportOption {
  id: string;
  name: string;
  cost: number;
}

export interface Quote {
  id: string;
  supplierName: string;
  productName: string;
  unitPrice: number;
  weightKg: number;
  quantity: number;
  shippingOptions: {
    [key in ShippingType]?: ShippingCostDetail;
  };
  currency: Currency;
  localTransportOptions: LocalTransportOption[];
}
