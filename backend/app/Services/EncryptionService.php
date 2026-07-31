<?php

namespace App\Services;

class EncryptionService
{
    private string $key;

    public function __construct()
    {
        $this->key = substr(hash('sha256', env('CONFIG_ENCRYPTION_KEY', 'default-key'), true), 0, 32);
    }

    public function encrypt(string $data): string
    {
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $this->key, OPENSSL_RAW_DATA, $iv);
        return base64_encode($iv . $encrypted);
    }

    public function decrypt(string $data): string
    {
        $decoded = base64_decode($data);
        $iv = substr($decoded, 0, 16);
        $encrypted = substr($decoded, 16);
        return openssl_decrypt($encrypted, 'AES-256-CBC', $this->key, OPENSSL_RAW_DATA, $iv);
    }
}
