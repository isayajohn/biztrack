import{apiClient}from"./apiClient";const unwrap=<T>(r:{data:{data:T}})=>r.data.data;
export type Branch={id:string;name:string;code:string;phone:string|null;address:string|null;isDefault:boolean;isActive:boolean;staffCount:number};
export type StaffRole="OWNER"|"MANAGER"|"CASHIER"|"INVENTORY"|"ACCOUNTANT"|"CUSTOM";
export type StaffMember={id:string;user:{id:string;name:string;email:string;phone:string|null};role:StaffRole;permissions:string[];status:"ACTIVE"|"INACTIVE";branch:{id:string;name:string}|null;createdAt:string};
export async function getBranches(){return unwrap<{branches:Branch[]}>(await apiClient.get("/branches")).branches??[]}
export async function createBranch(data:{name:string;code:string;phone?:string;address?:string}){return unwrap<Branch>(await apiClient.post("/branches",data))}
export async function updateBranch(id:string,data:Partial<{name:string;code:string;phone:string;address:string;isActive:boolean}>){return unwrap<Branch>(await apiClient.put(`/branches/${id}`,data))}
export async function makeDefaultBranch(id:string){return unwrap<Branch>(await apiClient.put(`/branches/${id}/default`))}
export async function deleteBranch(id:string){await apiClient.delete(`/branches/${id}`)}
export async function getStaff(){return unwrap<{staff:StaffMember[];permissions:string[]}>(await apiClient.get("/staff"))}
export async function createStaff(data:{name:string;email:string;phone?:string;password?:string;role:Exclude<StaffRole,"OWNER">;branchId?:string;permissions?:string[]}){return unwrap<StaffMember>(await apiClient.post("/staff",data))}
export async function updateStaff(id:string,data:Partial<{role:Exclude<StaffRole,"OWNER">;branchId:string|null;permissions:string[];status:"ACTIVE"|"INACTIVE"}>){return unwrap<StaffMember>(await apiClient.put(`/staff/${id}`,data))}
export async function removeStaff(id:string){await apiClient.delete(`/staff/${id}`)}
