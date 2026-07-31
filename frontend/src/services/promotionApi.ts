import { apiClient } from "./apiClient";
export type Promotion={id:string;name:string;code:string;type:"PERCENTAGE"|"FIXED";value:number;minimumPurchase:number;maximumDiscount:number|null;startsAt:string;endsAt:string;usageLimit:number|null;timesUsed:number;isActive:boolean;isAvailable:boolean};
export type PromotionInput={name:string;code:string;type:"PERCENTAGE"|"FIXED";value:number;minimumPurchase:number;maximumDiscount?:number;startsAt:string;endsAt:string;usageLimit?:number;isActive?:boolean};
const unwrap=<T>(response:{data:{data:T}})=>response.data.data;
export async function getPromotions(available=false){return unwrap<{promotions:Promotion[]}>(await apiClient.get("/promotions",{params:available?{available:true}:undefined})).promotions??[];}
export async function createPromotion(data:PromotionInput){return unwrap<Promotion>(await apiClient.post("/promotions",data));}
export async function updatePromotion(id:string,data:Partial<PromotionInput>){return unwrap<Promotion>(await apiClient.put(`/promotions/${id}`,data));}
export async function deletePromotion(id:string){await apiClient.delete(`/promotions/${id}`);}
