<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Business;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
class BranchController extends Controller
{
    private function business(): ?Business { return Business::forUser(auth()->user()); }
    public function index(): JsonResponse { $business = $this->business(); $branches = $business?->branches()->withCount('memberships')->orderByDesc('is_default')->orderBy('name')->get() ?? collect(); return response()->json(['success' => true, 'data' => ['branches' => $branches->map(fn ($b) => $this->format($b))]]); }
    public function store(Request $request): JsonResponse { $business = $this->business(); if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404); $data = $request->validate(['name' => 'required|string|max:255', 'code' => ['required','string','max:30',Rule::unique('branches')->where('business_id',$business->id)], 'phone' => 'nullable|string|max:50', 'address' => 'nullable|string|max:1000']); $branch = Branch::create(['business_id'=>$business->id,'name'=>$data['name'],'code'=>strtoupper($data['code']),'phone'=>$data['phone']??null,'address'=>$data['address']??null,'is_default'=>false,'is_active'=>true]); $this->audit('BRANCH_CREATED',$branch->id); return response()->json(['success'=>true,'data'=>$this->format($branch)],201); }
    public function update(Request $request,string $id): JsonResponse { $business=$this->business(); $branch=$business?->branches()->find($id); if(!$branch)return response()->json(['success'=>false,'error'=>'Branch not found'],404); $data=$request->validate(['name'=>'sometimes|required|string|max:255','code'=>['sometimes','required','string','max:30',Rule::unique('branches')->where('business_id',$business->id)->ignore($id)],'phone'=>'nullable|string|max:50','address'=>'nullable|string|max:1000','isActive'=>'sometimes|boolean']); if($branch->is_default && array_key_exists('isActive',$data) && !$data['isActive'])return response()->json(['success'=>false,'error'=>'The default branch cannot be deactivated'],422); $branch->update(['name'=>$data['name']??$branch->name,'code'=>isset($data['code'])?strtoupper($data['code']):$branch->code,'phone'=>array_key_exists('phone',$data)?$data['phone']:$branch->phone,'address'=>array_key_exists('address',$data)?$data['address']:$branch->address,'is_active'=>$data['isActive']??$branch->is_active]); $this->audit('BRANCH_UPDATED',$id); return response()->json(['success'=>true,'data'=>$this->format($branch->fresh()->loadCount('memberships'))]); }
    public function makeDefault(string $id): JsonResponse { $business=$this->business(); $branch=$business?->branches()->find($id); if(!$branch)return response()->json(['success'=>false,'error'=>'Branch not found'],404); DB::transaction(function()use($business,$branch){$business->branches()->update(['is_default'=>false]);$branch->update(['is_default'=>true,'is_active'=>true]);}); return response()->json(['success'=>true,'data'=>$this->format($branch->fresh())]); }
    public function destroy(string $id): JsonResponse { $business=$this->business(); $branch=$business?->branches()->withCount('memberships')->find($id); if(!$branch)return response()->json(['success'=>false,'error'=>'Branch not found'],404); if($branch->is_default||$branch->memberships_count>0)return response()->json(['success'=>false,'error'=>'Default or assigned branches cannot be deleted'],422);$branch->delete();$this->audit('BRANCH_DELETED',$id);return response()->json(['success'=>true,'data'=>['message'=>'Branch deleted']]); }
    private function format(Branch $b):array{return['id'=>$b->id,'name'=>$b->name,'code'=>$b->code,'phone'=>$b->phone,'address'=>$b->address,'isDefault'=>(bool)$b->is_default,'isActive'=>(bool)$b->is_active,'staffCount'=>$b->memberships_count??$b->memberships()->count()];}
    private function audit(string $action,string $id):void{AuditService::log(['actor_id'=>auth()->id(),'action'=>$action,'target_type'=>'Branch','target_id'=>$id]);}
}
