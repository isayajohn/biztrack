<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DebtAttachment extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'debt_id', 'debt_payment_id', 'file_path', 'file_name',
        'mime_type', 'file_size', 'uploaded_by',
    ];

    public function debt()
    {
        return $this->belongsTo(Debt::class);
    }

    public function payment()
    {
        return $this->belongsTo(DebtPayment::class, 'debt_payment_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
